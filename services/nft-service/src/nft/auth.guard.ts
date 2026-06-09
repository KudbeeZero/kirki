import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * Minimal gateway-trust guard.
 *
 * The API gateway authenticates the bearer token (auth-service is the authority)
 * and forwards the verified user id as `x-user-id`. This guard simply requires
 * that header to be present, protecting write routes like minting from
 * unauthenticated access on the internal network.
 */
@Injectable()
export class GatewayAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (!req.headers['x-user-id']) {
      throw new UnauthorizedException('Authentication required.');
    }
    return true;
  }
}
