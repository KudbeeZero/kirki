import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // ── Hardened HTTP defaults ────────────────────────────────────────────────
  app.use(helmet()); // sane security headers (CSP, HSTS, noSniff, frameguard…)
  app.set('trust proxy', 1); // correct client IP behind Cloudflare/Railway

  // Strict input validation: strip unknown props, reject extras, auto-transform.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // CORS limited to known first-party origins; credentials enabled for cookies.
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(','),
    credentials: true,
  });

  const port = Number(process.env.NFT_SERVICE_PORT ?? 4007);
  await app.listen(port);
  Logger.log(`nft-service listening on :${port}`, 'Bootstrap');
}

void bootstrap();
