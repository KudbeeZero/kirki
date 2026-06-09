import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { AccessTokenClaims, AuthResult, AuthTokens } from '@simcoin/types';
import { AuthService } from './auth.service.js';
import { RegisterDto, LoginDto } from './dto/auth.dto.js';
import { Public, CurrentUser } from './decorators.js';
import { securityConfig } from '../config/security.config.js';

/**
 * HTTP surface for authentication.
 *
 * The refresh token is delivered ONLY as an HttpOnly, Secure, SameSite=strict
 * cookie scoped to /auth — it is never readable by JavaScript, which neutralises
 * XSS token theft. The access token is returned in the body for the client to
 * hold in memory (not localStorage).
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { ttl: securityConfig.rateLimit.register.ttlSeconds * 1000, limit: securityConfig.rateLimit.register.limit } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.register(dto, this.meta(req));
    return this.respond(res, result);
  }

  @Public()
  @Throttle({ default: { ttl: securityConfig.rateLimit.login.ttlSeconds * 1000, limit: securityConfig.rateLimit.login.limit } })
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto, this.meta(req));
    return this.respond(res, result);
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.[securityConfig.cookies.refreshCookieName];
    if (!raw) throw new UnauthorizedException('No refresh token.');
    const tokens = await this.auth.refresh(raw, this.meta(req));
    this.setRefreshCookie(res, tokens);
    return { accessToken: tokens.accessToken, accessTokenExpiresAt: tokens.accessTokenExpiresAt };
  }

  @HttpCode(204)
  @Post('logout')
  async logout(@CurrentUser() user: AccessTokenClaims, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(user.sid, user.sub, this.meta(req));
    res.clearCookie(securityConfig.cookies.refreshCookieName, { path: securityConfig.cookies.path });
  }

  @Get('me')
  me(@CurrentUser() user: AccessTokenClaims) {
    return { id: user.sub, role: user.role, mfa: user.mfa };
  }

  // ── helpers ────────────────────────────────────────────────────────────────
  private respond(res: Response, result: AuthResult) {
    this.setRefreshCookie(res, result.tokens);
    return {
      user: result.user,
      accessToken: result.tokens.accessToken,
      accessTokenExpiresAt: result.tokens.accessTokenExpiresAt,
    };
  }

  private setRefreshCookie(res: Response, tokens: AuthTokens) {
    const c = securityConfig.cookies;
    res.cookie(c.refreshCookieName, tokens.refreshToken, {
      httpOnly: c.httpOnly,
      secure: c.secure,
      sameSite: c.sameSite,
      path: c.path,
      expires: new Date(tokens.refreshTokenExpiresAt),
    });
  }

  private meta(req: Request) {
    return { ip: req.ip, userAgent: req.get('user-agent') ?? undefined };
  }
}
