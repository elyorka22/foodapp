import { Injectable } from '@nestjs/common';

interface RouteMetric {
  count: number;
  errors: number;
  totalMs: number;
  maxMs: number;
}

@Injectable()
export class MetricsService {
  private startedAt = Date.now();
  private routes = new Map<string, RouteMetric>();
  private totalRequests = 0;
  private totalErrors = 0;

  record(method: string, url: string, ms: number, isError: boolean) {
    const path = url.split('?')[0].replace(/\/[a-zA-Z0-9]{20,}/g, '/:id');
    const key = `${method} ${path}`;
    const cur = this.routes.get(key) ?? { count: 0, errors: 0, totalMs: 0, maxMs: 0 };
    cur.count++;
    cur.totalMs += ms;
    if (ms > cur.maxMs) cur.maxMs = ms;
    if (isError) {
      cur.errors++;
      this.totalErrors++;
    }
    this.routes.set(key, cur);
    this.totalRequests++;
  }

  snapshot() {
    const uptimeSec = Math.floor((Date.now() - this.startedAt) / 1000);
    const mem = process.memoryUsage();
    const topRoutes = [...this.routes.entries()]
      .map(([route, m]) => ({
        route,
        count: m.count,
        errors: m.errors,
        avgMs: Math.round(m.totalMs / m.count),
        maxMs: m.maxMs,
      }))
      .sort((a, b) => b.avgMs - a.avgMs)
      .slice(0, 15);

    return {
      uptimeSec,
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      memory: {
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
        rssMb: Math.round(mem.rss / 1024 / 1024),
      },
      topRoutes,
    };
  }
}
