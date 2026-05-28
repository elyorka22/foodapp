import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { validateEnv } from './common/config/env.validation';
import { initSentry } from './common/monitoring/sentry.init';

async function bootstrap() {
  const envCheck = validateEnv();
  const bootLogger = new Logger('Bootstrap');
  if (!envCheck.ok) {
    envCheck.errors.forEach((e) => bootLogger.error(e));
    process.exit(1);
  }
  envCheck.warnings.forEach((w) => bootLogger.warn(w));

  await initSentry();

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
    bufferLogs: true,
  });
  const config = app.get(ConfigService);

  app.enableShutdownHooks();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());

  app.setGlobalPrefix(config.get('API_PREFIX', 'api/v1'));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const corsOrigins = config.get<string>('CORS_ORIGINS', '').split(',').filter(Boolean);
  app.enableCors({
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true,
  });

  if (config.get('NODE_ENV') !== 'production') {
    const swagger = new DocumentBuilder()
      .setTitle('FoodMarket API')
      .setDescription('Uzbekistan food delivery marketplace')
      .setVersion('1.2')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));
  }

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
  bootLogger.log(`API started on port ${port} with prefix /${config.get('API_PREFIX', 'api/v1')}`);

  const shutdown = async (signal: string) => {
    bootLogger.log(`${signal} — graceful shutdown`);
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
