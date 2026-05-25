import { Logger } from '@nestjs/common';

const logger = new Logger('Sentry');

export async function initSentry(): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    const Sentry = await import('@sentry/node');
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      release: process.env.APP_VERSION ?? 'foodmarket@1.0.0',
    });
    logger.log('Sentry initialized');
  } catch {
    logger.warn('Sentry DSN set but @sentry/node not installed — run: npm i @sentry/node -w @foodmarket/api');
  }
}
