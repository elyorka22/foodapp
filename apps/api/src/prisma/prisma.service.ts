import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@foodmarket/database';
import { SlowQueryService } from '../common/monitoring/slow-query.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Prisma');

  constructor(private slowQuery: SlowQueryService) {
    super({
      log:
        process.env.SLOW_QUERY_MS || process.env.NODE_ENV === 'development'
          ? [{ emit: 'event', level: 'query' }]
          : ['error'],
    });
  }

  async onModuleInit() {
    // Prisma 6: query events for slow-query tracking (replaces deprecated $use middleware)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).$on('query', (event: { duration: number; target?: string }) => {
      const model = event.target?.replace('prisma.', '') ?? 'query';
      this.slowQuery.record(model, 'query', event.duration);
    });
    await this.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
