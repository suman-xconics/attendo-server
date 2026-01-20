import { auth } from "@/lib/auth";
import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";
import type { Schema } from "hono";

export interface AppBindings {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    role: string | null;
		session: typeof auth.$Infer.Session.session | null;
  };
}

// eslint-disable-next-line ts/no-empty-object-type
export type AppOpenAPI<S extends Schema = {}> = OpenAPIHono<AppBindings, S>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<
  R,
  AppBindings
>;
