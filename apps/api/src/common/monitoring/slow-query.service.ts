import { Injectable, Logger } from '@nestjs/common';

export interface SlowQuery {
  model: string;
  action: string;
  durationMs: number;
  at: string;
}

@Injectable()
export class SlowQueryService {
  private readonly logger = new Logger('SlowQuery');
  private readonly thresholdMs = parseInt(process.env.SLOW_QUERY_MS ?? '500', 10);
  private recent: SlowQuery[] = [];
  private maxRecent = 50;

  record(model: string, action: string, durationMs: number) {
    if (durationMs < this.thresholdMs) return;
    const entry: SlowQuery = {
      model,
      action,
      durationMs,
      at: new Date().toISOString(),
    };
    this.recent.unshift(entry);
    if (this.recent.length > this.maxRecent) this.recent.pop();
    this.logger.warn(`Slow query ${model}.${action} ${durationMs}ms`);
  }

  snapshot() {
    return {
      thresholdMs: this.thresholdMs,
      count: this.recent.length,
      recent: this.recent.slice(0, 20),
    };
  }
}
