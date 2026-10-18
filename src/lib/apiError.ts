/**
 * Consistent API Error formatting and HTTP response helpers.
 * Ensures zero secret or stack trace leakage across all API boundaries.
 */

import { NextResponse } from "next/server";

export interface ApiErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "RATE_LIMIT_EXCEEDED"
  | "INTERNAL_SERVER_ERROR"
  | "NOT_FOUND";

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode | string,
    message: string,
    public readonly status: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Build a structured NextResponse conforming to { error: { code, message, details? } }
 */
export function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown,
  headers?: Record<string, string>,
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };

  return NextResponse.json(body, {
    status,
    headers,
  });
}

export const ApiErrors = {
  badRequest: (message: string, details?: unknown) =>
    createErrorResponse("VALIDATION_ERROR", message, 400, details),

  payloadTooLarge: (maxBytes: number) =>
    createErrorResponse(
      "PAYLOAD_TOO_LARGE",
      `Payload exceeds maximum allowed size of ${(maxBytes / (1024 * 1024)).toFixed(1)}MB`,
      413,
    ),

  unsupportedMediaType: (message: string = "Only CSV files are supported") =>
    createErrorResponse("UNSUPPORTED_MEDIA_TYPE", message, 415),

  rateLimitExceeded: (retryAfterSeconds: number) =>
    createErrorResponse(
      "RATE_LIMIT_EXCEEDED",
      "Too many requests. Please try again shortly.",
      429,
      undefined,
      {
        "Retry-After": retryAfterSeconds.toString(),
      },
    ),

  internal: (safeMessage: string = "An unexpected error occurred. Please try again.") =>
    createErrorResponse("INTERNAL_SERVER_ERROR", safeMessage, 500),
};
