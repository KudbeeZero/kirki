/**
 * Application error hierarchy.
 *
 * Every error carries a stable, machine-readable `code` and an HTTP `status`,
 * so the API layer can serialize any thrown error into a consistent JSON body
 * without a giant switch statement. Domain code throws these; transport code
 * formats them via {@link toErrorBody}.
 */

export type ErrorCode =
  | 'INTERNAL'
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'DOMAIN_RULE';

export interface ErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    /** Optional field-level detail, e.g. validation issues. */
    details?: unknown;
  };
}

/** Base class for all known/expected application errors. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;
  /** Distinguishes errors safe to surface to clients from leaked internals. */
  readonly expose: boolean;

  constructor(
    message: string,
    options: {
      code?: ErrorCode;
      status?: number;
      details?: unknown;
      expose?: boolean;
      cause?: unknown;
    } = {},
  ) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = new.target.name;
    this.code = options.code ?? 'INTERNAL';
    this.status = options.status ?? 500;
    this.details = options.details;
    this.expose = options.expose ?? this.status < 500;
    Error.captureStackTrace?.(this, new.target);
  }

  toBody(): ErrorBody {
    return {
      error: {
        code: this.code,
        message: this.expose ? this.message : 'Internal server error',
        ...(this.details !== undefined ? { details: this.details } : {}),
      },
    };
  }
}

/** A business rule was violated (HTTP 422). */
export class DomainError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, { code: 'DOMAIN_RULE', status: 422, details, expose: true });
  }
}

/** Input failed validation (HTTP 400). `details` typically lists field issues. */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, { code: 'VALIDATION', status: 400, details, expose: true });
  }
}

/** A requested resource does not exist (HTTP 404). */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string | number) {
    const message =
      id === undefined ? `${resource} not found` : `${resource} '${id}' not found`;
    super(message, { code: 'NOT_FOUND', status: 404, expose: true });
  }
}

/** Authentication is missing or invalid (HTTP 401). */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, { code: 'UNAUTHORIZED', status: 401, expose: true });
  }
}

/** Authenticated but not allowed (HTTP 403). */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, { code: 'FORBIDDEN', status: 403, expose: true });
  }
}

/** A conflicting state prevented the operation (HTTP 409). */
export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, { code: 'CONFLICT', status: 409, details, expose: true });
  }
}

/** Type guard for {@link AppError}. */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

/**
 * Normalises any thrown value into a serializable {@link ErrorBody}.
 * Unknown errors collapse to a generic 500 to avoid leaking internals.
 */
export function toErrorBody(err: unknown): ErrorBody {
  if (isAppError(err)) return err.toBody();
  return { error: { code: 'INTERNAL', message: 'Internal server error' } };
}

/** HTTP status for any thrown value (500 when unknown). */
export function statusOf(err: unknown): number {
  return isAppError(err) ? err.status : 500;
}
