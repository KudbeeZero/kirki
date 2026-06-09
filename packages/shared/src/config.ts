/**
 * Environment configuration loading and validation.
 *
 * Services should fail fast at boot if their environment is misconfigured,
 * rather than throwing deep in a request handler. This module provides small,
 * dependency-free helpers to read, coerce, and validate `process.env` (or any
 * provided record) into a typed config object, collecting *all* problems into a
 * single {@link ValidationError} instead of failing on the first one.
 */
import { ValidationError } from './errors.js';

/** A source of environment variables. Defaults to `process.env`. */
export type EnvSource = Record<string, string | undefined>;

/** Describes how to read and coerce a single environment variable. */
export interface VarSpec<T> {
  /** Coerce the raw string into the target type, or throw on bad input. */
  parse: (raw: string) => T;
  /** Value used when the variable is absent. If omitted, the var is required. */
  default?: T;
  /** Human-readable description, surfaced in error messages. */
  description?: string;
}

/** A schema maps config keys to the env var name + how to parse it. */
export type Schema = Record<string, { env: string } & VarSpec<unknown>>;

/** Infer the resulting config object type from a schema. */
export type Config<S extends Schema> = {
  [K in keyof S]: S[K] extends { parse: (raw: string) => infer T } ? T : never;
};

// ── Coercion helpers ─────────────────────────────────────────────────────────

/** Pass-through string parser. */
export const str = (): VarSpec<string>['parse'] => (raw) => raw;

/** Parse an integer, rejecting NaN and floats. */
export const int =
  (): VarSpec<number>['parse'] =>
  (raw) => {
    if (!/^-?\d+$/.test(raw.trim())) throw new Error(`expected an integer, got "${raw}"`);
    return Number.parseInt(raw, 10);
  };

/** Parse a boolean from common truthy/falsy spellings. */
export const bool =
  (): VarSpec<boolean>['parse'] =>
  (raw) => {
    const v = raw.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(v)) return true;
    if (['0', 'false', 'no', 'off'].includes(v)) return false;
    throw new Error(`expected a boolean, got "${raw}"`);
  };

/** Parse a value constrained to a fixed set of allowed strings. */
export const oneOf =
  <const T extends readonly string[]>(allowed: T): VarSpec<T[number]>['parse'] =>
  (raw) => {
    if (!allowed.includes(raw as T[number])) {
      throw new Error(`expected one of [${allowed.join(', ')}], got "${raw}"`);
    }
    return raw as T[number];
  };

/** Parse and validate a URL string. */
export const url = (): VarSpec<string>['parse'] => (raw) => {
  // Throws on malformed input; we keep the original string.
  // eslint-disable-next-line no-new
  new URL(raw);
  return raw;
};

// ── Loader ───────────────────────────────────────────────────────────────────

/**
 * Build and validate a typed config object from `source` against `schema`.
 * Collects every missing/invalid variable and throws a single
 * {@link ValidationError} whose `details` lists all issues.
 *
 * @example
 * const cfg = loadConfig({
 *   port: { env: 'PORT', parse: int(), default: 3000 },
 *   nodeEnv: { env: 'NODE_ENV', parse: oneOf(['development','production','test']) },
 *   redisUrl: { env: 'REDIS_URL', parse: url() },
 * });
 * // cfg: { port: number; nodeEnv: 'development'|'production'|'test'; redisUrl: string }
 */
export function loadConfig<S extends Schema>(
  schema: S,
  source: EnvSource = typeof process !== 'undefined' ? process.env : {},
): Config<S> {
  const result: Record<string, unknown> = {};
  const issues: Array<{ key: string; env: string; message: string }> = [];

  for (const key of Object.keys(schema)) {
    const spec = schema[key]!;
    const raw = source[spec.env];

    if (raw === undefined || raw === '') {
      if ('default' in spec) {
        result[key] = spec.default;
      } else {
        issues.push({
          key,
          env: spec.env,
          message: `missing required env var${spec.description ? ` (${spec.description})` : ''}`,
        });
      }
      continue;
    }

    try {
      result[key] = spec.parse(raw);
    } catch (err) {
      issues.push({
        key,
        env: spec.env,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (issues.length > 0) {
    throw new ValidationError(
      `Invalid configuration: ${issues.map((i) => i.env).join(', ')}`,
      issues,
    );
  }

  return result as Config<S>;
}

/** Read a single required env var, throwing if absent. */
export function requireEnv(
  name: string,
  source: EnvSource = typeof process !== 'undefined' ? process.env : {},
): string {
  const value = source[name];
  if (value === undefined || value === '') {
    throw new ValidationError(`Missing required env var: ${name}`);
  }
  return value;
}
