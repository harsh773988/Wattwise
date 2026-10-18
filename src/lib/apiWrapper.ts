/**
 * Higher-order API wrapper (withApi) applying rate limiting,
 * request size enforcement, structured logging, and unified error mapping.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getRateLimitHeaders } from "./rateLimit";
import { ApiErrors, createErrorResponse } from "./apiError";
import { getEnv, MAX_CSV_SIZE_BYTES } from "./config";
import { logger } from "./logger";

export interface WithApiOptions<TBody, TQuery> {
  readonly bodySchema?: z.ZodType<TBody>;
  readonly querySchema?: z.ZodType<TQuery>;
  readonly maxSizeBytes?: number;
  readonly skipRateLimit?: boolean;
}

export interface ApiContext<TBody, TQuery> {
  readonly body: TBody;
  readonly query: TQuery;
  readonly ip: string;
}

/** Extract client IP from headers. */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

/**
 * Wrap Next.js route handlers with rate limiting, size guards, validation, and error mapping.
 */
export function withApi<TBody = unknown, TQuery = unknown>(
  handler: (req: NextRequest, ctx: ApiContext<TBody, TQuery>) => Promise<NextResponse>,
  options?: WithApiOptions<TBody, TQuery>,
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const ip = getClientIp(req);
    const env = getEnv();

    // 1. Rate limiting guard
    if (!options?.skipRateLimit) {
      const rateLimitRes = checkRateLimit(ip, {
        maxRequests: env.RATE_LIMIT_MAX,
        windowMs: env.RATE_LIMIT_WINDOW_MS,
      });

      if (!rateLimitRes.allowed) {
        logger.warn("Rate limit exceeded", { ip, path: req.nextUrl.pathname });
        return createErrorResponse(
          "RATE_LIMIT_EXCEEDED",
          "Too many requests. Please try again shortly.",
          429,
          undefined,
          getRateLimitHeaders(rateLimitRes),
        );
      }
    }

    // 2. Request size limit guard
    const contentLength = req.headers.get("content-length");
    const maxBytes = options?.maxSizeBytes ?? MAX_CSV_SIZE_BYTES;
    if (contentLength && parseInt(contentLength, 10) > maxBytes) {
      logger.warn("Payload too large rejected", { size: contentLength, max: maxBytes });
      return ApiErrors.payloadTooLarge(maxBytes);
    }

    // 3. Query string validation
    let queryData: TQuery = {} as TQuery;
    if (options?.querySchema) {
      const url = new URL(req.url);
      const params = Object.fromEntries(url.searchParams.entries());
      const queryParse = options.querySchema.safeParse(params);
      if (!queryParse.success) {
        const issues = queryParse.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        return ApiErrors.badRequest(`Invalid query parameters: ${issues}`);
      }
      queryData = queryParse.data;
    }

    // 4. Body validation (for POST/PUT/PATCH)
    let bodyData: TBody = {} as TBody;
    if (options?.bodySchema && req.method !== "GET" && req.method !== "DELETE") {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          const rawJson = await req.json();
          const bodyParse = options.bodySchema.safeParse(rawJson);
          if (!bodyParse.success) {
            const issues = bodyParse.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
            return ApiErrors.badRequest(`Validation error: ${issues}`);
          }
          bodyData = bodyParse.data;
        } catch {
          return ApiErrors.badRequest("Malformed JSON body");
        }
      }
    }

    // 5. Invoke handler with structured error mapping
    try {
      logger.info(`API ${req.method} ${req.nextUrl.pathname}`, { ip });
      return await handler(req, {
        body: bodyData,
        query: queryData,
        ip,
      });
    } catch (err: unknown) {
      logger.error("Unhandled API error", {
        path: req.nextUrl.pathname,
        error: err instanceof Error ? err.message : String(err),
      });

      // Always return safe error to client — never leak stack trace or internal messages
      return ApiErrors.internal("An unexpected server error occurred. Please try again.");
    }
  };
}
