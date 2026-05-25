import { Injectable } from '@nestjs/common';

@Injectable()
export class WsMetricsService {
  private connections = 0;
  private locationUpdates = 0;
  private throttledUpdates = 0;
  private rejectedGps = 0;
  private duplicateSkipped = 0;
  private statusEmits = 0;
  private peakConnections = 0;
  private lastLocationAt = 0;
  private reconnectsLast5Min = 0;
  private reconnectTimestamps: number[] = [];

  connectionOpened() {
    this.connections++;
    if (this.connections > this.peakConnections) this.peakConnections = this.connections;
    const now = Date.now();
    this.reconnectTimestamps.push(now);
    this.pruneReconnects();
    this.reconnectsLast5Min = this.reconnectTimestamps.length;
  }

  connectionClosed() {
    this.connections = Math.max(0, this.connections - 1);
  }

  recordLocation(throttled: boolean, rejected: boolean, duplicate = false) {
    if (duplicate) this.duplicateSkipped++;
    else if (rejected) this.rejectedGps++;
    else if (throttled) this.throttledUpdates++;
    else this.locationUpdates++;
    this.lastLocationAt = Date.now();
  }

  recordStatusEmit() {
    this.statusEmits++;
  }

  private pruneReconnects() {
    const cutoff = Date.now() - 5 * 60_000;
    this.reconnectTimestamps = this.reconnectTimestamps.filter((t) => t >= cutoff);
    this.reconnectsLast5Min = this.reconnectTimestamps.length;
  }

  snapshot() {
    this.pruneReconnects();
    return {
      activeConnections: this.connections,
      peakConnections: this.peakConnections,
      locationUpdates: this.locationUpdates,
      throttledUpdates: this.throttledUpdates,
      rejectedGps: this.rejectedGps,
      duplicateSkipped: this.duplicateSkipped,
      statusEmits: this.statusEmits,
      reconnectsLast5Min: this.reconnectsLast5Min,
      reconnectSpike: this.reconnectsLast5Min > 30,
      lastLocationAt: this.lastLocationAt ? new Date(this.lastLocationAt).toISOString() : null,
      horizontalScalingNote: process.env.REDIS_WS_ADAPTER_URL
        ? 'redis_adapter_configured'
        : 'single_instance',
    };
  }
}
