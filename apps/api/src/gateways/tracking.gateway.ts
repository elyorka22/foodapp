import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { smoothGps, shouldAcceptGpsPoint } from '../common/utils/gps-smooth';
import { WsMetricsService } from '../common/monitoring/ws-metrics.service';

const LOCATION_MIN_INTERVAL_MS = 4000;

function locationFingerprint(lat: number, lng: number): string {
  return `${lat.toFixed(4)}:${lng.toFixed(4)}`;
}

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGINS?.split(',') ?? true, credentials: true },
  namespace: '/tracking',
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 20000,
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);
  private lastLocationAt = new Map<string, number>();
  private lastPosition = new Map<string, { lat: number; lng: number }>();
  private lastPersistedFingerprint = new Map<string, string>();

  constructor(
    private prisma: PrismaService,
    private wsMetrics: WsMetricsService,
  ) {}

  handleConnection(client: Socket) {
    this.wsMetrics.connectionOpened();
    client.emit('connected', { ok: true, ts: Date.now(), transport: client.conn.transport.name });
  }

  handleDisconnect() {
    this.wsMetrics.connectionClosed();
  }

  @SubscribeMessage('subscribe:order')
  handleSubscribeOrder(client: Socket, orderId: string) {
    client.join(`order:${orderId}`);
    return { event: 'subscribed', data: { orderId } };
  }

  @SubscribeMessage('subscribe:courier')
  handleSubscribeCourier(client: Socket, courierId: string) {
    client.join(`courier:${courierId}`);
    return { event: 'subscribed', data: { courierId } };
  }

  @SubscribeMessage('courier:location')
  async handleCourierLocation(
    client: Socket,
    payload: {
      courierId: string;
      latitude: number;
      longitude: number;
      heading?: number;
      speed?: number;
      orderId?: string;
      clientTs?: number;
    },
  ) {
    const now = Date.now();
    const last = this.lastLocationAt.get(payload.courierId) ?? 0;
    if (now - last < LOCATION_MIN_INTERVAL_MS) {
      this.wsMetrics.recordLocation(true, false);
      return { success: true, throttled: true };
    }

    const prev = this.lastPosition.get(payload.courierId) ?? null;
    const raw = { lat: payload.latitude, lng: payload.longitude };
    if (!shouldAcceptGpsPoint(prev, raw)) {
      this.wsMetrics.recordLocation(false, true);
      return { success: false, rejected: 'gps_jump' };
    }
    const smoothed = smoothGps(prev, raw);
    const fingerprint = locationFingerprint(smoothed.lat, smoothed.lng);
    const lastFp = this.lastPersistedFingerprint.get(payload.courierId);
    const isDuplicate = lastFp === fingerprint;

    this.lastLocationAt.set(payload.courierId, now);
    this.lastPosition.set(payload.courierId, smoothed);

    if (!isDuplicate) {
      try {
        await this.prisma.courier.update({
          where: { id: payload.courierId },
          data: { currentLat: smoothed.lat, currentLng: smoothed.lng, status: 'ON_DELIVERY' },
        });
        await this.prisma.courierLocation.create({
          data: {
            courierId: payload.courierId,
            latitude: smoothed.lat,
            longitude: smoothed.lng,
            heading: payload.heading,
            speed: payload.speed,
          },
        });
        this.lastPersistedFingerprint.set(payload.courierId, fingerprint);
      } catch (e) {
        this.logger.warn(`Location persist failed: ${e}`);
        return { success: false, error: 'db_error', retry: true };
      }
    } else {
      this.wsMetrics.recordLocation(false, false, true);
    }

    const locationUpdate = {
      courierId: payload.courierId,
      latitude: smoothed.lat,
      longitude: smoothed.lng,
      heading: payload.heading,
      speed: payload.speed,
      timestamp: new Date().toISOString(),
    };

    this.server.to(`courier:${payload.courierId}`).emit('location:update', locationUpdate);
    if (payload.orderId) {
      this.server.to(`order:${payload.orderId}`).emit('location:update', locationUpdate);
    }

    if (!isDuplicate) this.wsMetrics.recordLocation(false, false);
    return { success: true, duplicate: isDuplicate };
  }

  emitOrderStatus(orderId: string, status: string, data?: Record<string, unknown>) {
    this.server.to(`order:${orderId}`).emit('order:status', { orderId, status, ...data });
    this.wsMetrics.recordStatusEmit();
  }
}
