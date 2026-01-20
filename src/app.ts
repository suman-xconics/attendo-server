import configureOpenAPI from "@/config/openapi";
import env from "@/env";
import createApp from "@/lib/create-app";
import { healthHandler } from "./utils/handler";
import { routes } from "./routes";

const app = createApp();

// Configure OpenAPI first
configureOpenAPI(app);

// Health check (public)
app.get("/health", healthHandler({
  appName: env.APP_NAME,
  includeMetrics: true,
}));

// Mount protected routes
app.route("/v1", routes)

export default app;
