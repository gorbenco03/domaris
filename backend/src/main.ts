/**
 * Domaris backend bootstrap
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { validateEnv } from './app/core/config-validation';
import * as dotenv from 'dotenv';
import helmet from 'helmet';

dotenv.config();
validateEnv();

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // --- Security headers ---
  app.use(helmet());

  // --- CORS: restrict to configured origins ---
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:19006'];

  if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGINS) {
    Logger.warn(
      '[CORS] CORS_ORIGINS env is not set in production — defaulting to empty allow-list. ' +
      'Set CORS_ORIGINS to a comma-separated list of allowed origins.',
    );
  }

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // --- Global ValidationPipe: strip unknown fields, enforce DTO constraints ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // --- Swagger: only in non-production ---
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Domaris API')
      .setDescription('The Real Estate Application API description')
      .setVersion('1.0')
      .addTag('listings')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    Logger.log('Swagger docs available at /api/docs (non-production only)');
  }

  const port = Number(process.env.PORT || 4000);
  const host =
    process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost');

  await app.listen(port, host);
  Logger.log(
    `Application is running on: http://${host}:${port}/${globalPrefix}`
  );
}

bootstrap();
