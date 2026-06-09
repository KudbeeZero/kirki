/**
 * Structured JSON logging.
 *
 * Every service logs newline-delimited JSON to stdout so the platform's log
 * shipper can index fields without regex parsing. Use {@link createLogger} at
 * a service boundary and pass the result down; use {@link Logger.child} to bind
 * request-scoped context (e.g. a requestId) without threading it manually.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/** Arbitrary structured fields merged into every record. */
export type LogContext = Record<string, unknown>;

export interface LogRecord {
  level: LogLevel;
  msg: string;
  time: string; // ISO-8601
  [field: string]: unknown;
}

export interface Logger {
  debug(msg: string, fields?: LogContext): void;
  info(msg: string, fields?: LogContext): void;
  warn(msg: string, fields?: LogContext): void;
  error(msg: string, fields?: LogContext): void;
  /** Returns a logger that merges `bindings` into every record it emits. */
  child(bindings: LogContext): Logger;
}

export interface LoggerOptions {
  /** Records below this level are dropped. Defaults to "info". */
  level?: LogLevel;
  /** Static fields bound to the logger (e.g. { service: "api" }). */
  base?: LogContext;
  /** Sink for serialized records. Defaults to console. Override in tests. */
  sink?: (line: string) => void;
  /** Clock, overridable in tests. Defaults to Date.now. */
  now?: () => number;
}

/**
 * Console-backed structured logger. Writes one JSON object per line; `error`
 * records are routed to `console.error`, everything else to `console.log`.
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const threshold = LEVEL_WEIGHT[options.level ?? 'info'];
  const base = options.base ?? {};
  const now = options.now ?? Date.now;
  const sink =
    options.sink ??
    ((line: string) => {
      // Default sink: stdout, with errors on stderr for ops alerting.
      console.log(line);
    });

  function emit(level: LogLevel, msg: string, fields?: LogContext): void {
    if (LEVEL_WEIGHT[level] < threshold) return;
    const record: LogRecord = {
      level,
      msg,
      time: new Date(now()).toISOString(),
      ...base,
      ...fields,
    };
    const line = safeStringify(record);
    if (options.sink) {
      sink(line);
    } else if (level === 'error') {
      console.error(line);
    } else {
      sink(line);
    }
  }

  return {
    debug: (msg, fields) => emit('debug', msg, fields),
    info: (msg, fields) => emit('info', msg, fields),
    warn: (msg, fields) => emit('warn', msg, fields),
    error: (msg, fields) => emit('error', msg, fields),
    child: (bindings) =>
      createLogger({ ...options, base: { ...base, ...bindings } }),
  };
}

/** JSON.stringify that never throws on circular refs or BigInt. */
function safeStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_key, val) => {
    if (typeof val === 'bigint') return val.toString();
    if (typeof val === 'object' && val !== null) {
      if (seen.has(val)) return '[Circular]';
      seen.add(val);
    }
    return val;
  });
}

/** A no-op logger, handy as a default argument in libraries and tests. */
export const noopLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  child: () => noopLogger,
};
