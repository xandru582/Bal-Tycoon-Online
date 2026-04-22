// ============================================================
// Central Express error handler.
//
// In production we NEVER return raw error messages to clients —
// they may contain SQL fragments, connection strings, or
// internal invariants that help attackers. Log internally,
// return a generic 500. In development we forward the real
// message for easier debugging.
// ============================================================

import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

export class HttpError extends Error {
  status: number;
  /** Safe for the client to see (default true if status < 500). */
  exposeMessage: boolean;

  constructor(status: number, message: string, exposeMessage?: boolean) {
    super(message);
    this.status = status;
    this.exposeMessage = exposeMessage ?? status < 500;
  }
}

// 4-arity signature required so Express treats this as an error handler.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  const status = Number.isInteger(err?.status) ? err.status : 500;
  const exposeMessage = err instanceof HttpError ? err.exposeMessage : status < 500;
  const clientMessage = exposeMessage && typeof err?.message === "string"
    ? err.message
    : "Internal server error";

  if (status >= 500) {
    console.error(`[ERR ${req.method} ${req.originalUrl}]`, err);
  }

  // Only send stack traces in development.
  const body: Record<string, unknown> = { error: clientMessage };
  if (env.NODE_ENV === "development" && err?.stack) {
    body["stack"] = String(err.stack).split("\n").slice(0, 5);
  }
  res.status(status).json(body);
}
