import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { DatabaseService } from '../database/database.service.js';
import { PasswordService } from '../crypto/password.service.js';
import { TokenService } from '../crypto/token.service.js';
import { SessionService } from '../sessions/session.service.js';
import { AuditService } from '../security/audit.service.js';
import { UsersRepository } from '../users/users.repository.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtAuthGuard, RolesGuard } from './guards.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Global per-IP rate limiting; auth endpoints tighten further with @Throttle.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('AUTH_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    DatabaseService,
    PasswordService,
    TokenService,
    SessionService,
    AuditService,
    UsersRepository,
    AuthService,
    // Order matters: rate-limit, then authenticate, then authorize.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
