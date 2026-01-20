import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { notFound, onError } from "stoker/middlewares";
import { defaultHook } from "stoker/openapi";
import { logger } from "hono/logger";
import { trimTrailingSlash } from "hono/trailing-slash";
import env from "@/env";
import type { AppBindings } from "@/types/app";
import { loggerPrint } from "@/utils/logger-print";
import { sessionMiddleware } from "@/middlewares/auth-middleware";
import { auth } from "./auth";

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook,
  });
}

export default function createApp() {
  const app = createRouter();

  // Core middleware (applied globally)
  app
    .use(requestId())
    .use(secureHeaders())
    .use(trimTrailingSlash())
    .use(
      cors({
        origin: env.WHITELISTED_ORIGINS || [],
        exposeHeaders: ["Content-Length", "X-Request-Id"],
        maxAge: 600,
        credentials: true,
        allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowHeaders: ["Content-Type", "Authorization"],
      })
    )
    .use(logger(loggerPrint))
    .use(sessionMiddleware)


  // AUTH ROUTES ONLY - before CSRF and general routes
  app.on(["POST", "GET"], ["/auth/*"], (c) => {
    return auth.handler(c.req.raw);
  });


  app.notFound(notFound);
  app.onError(onError);

  return app;
}
