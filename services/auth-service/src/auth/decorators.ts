import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AccessTokenClaims, AppRole } from '@simcoin/types';

/** Mark a route as public (skips JwtAuthGuard). */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Restrict a route to one or more roles (enforced by RolesGuard). */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);

/** Inject the authenticated user's token claims into a handler param. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AccessTokenClaims => {
    return ctx.switchToHttp().getRequest().user;
  },
);
