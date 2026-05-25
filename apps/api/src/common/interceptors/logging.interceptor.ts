import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { MetricsService } from '../monitoring/metrics.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Request');

  constructor(private metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.metrics.record(method, url, ms, false);
          if (ms > 2000 || url.includes('/ops/')) {
            this.logger.log(`${method} ${url} ${ms}ms`);
          }
        },
        error: (err) => {
          const ms = Date.now() - start;
          this.metrics.record(method, url, ms, true);
          this.logger.warn(`${method} ${url} ${ms}ms — ${err?.message ?? 'error'}`);
        },
      }),
    );
  }
}
