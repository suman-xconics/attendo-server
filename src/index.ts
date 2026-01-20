import { serve } from "@hono/node-server";

import app from "./app";
import env from "./env";
import { loggerPrint } from "./utils/logger-print";

const port = env.PORT;

loggerPrint(`Server started :  http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
