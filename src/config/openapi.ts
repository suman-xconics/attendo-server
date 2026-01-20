import type { OpenAPIObjectConfigure } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import packageJSON from "#/package.json" with { type: "json" };
import env from "@/env";
import type { AppOpenAPI } from "@/types/app";
import { auth } from "@/lib/auth";

export const openApiInfo: OpenAPIObjectConfigure<any, any> = {
  openapi: "3.0.0",
  info: {
    title: "Attendo Server",
    version: packageJSON.version,
    description: "OpenAPI specification for the Attendo server.",
  },
  tags: [
    {
      name: "Query Parameters",
      description: `
## Using Query Parameters for Filtering, Pagination, and Sorting

### Pagination
Use 'page' and 'pageSize' parameters:
- page: The page number (default: 1)
- pageSize: Number of items per page (default: 10, max: 250)

Example: ?page=2&pageSize=20

### Sorting
Use the 'sort' parameter with field and order:
- sort[0][field]: The field to sort by
- sort[0][order]: The sort order ('asc' or 'desc')

Example: ?sort[0][field]=productName&sort[0][order]=desc

### Multi-Sort
use sort[1][field], sort[1][order] and so on.

Example: ?sort[0][field]=productName&sort[0][order]=desc&sort[1][field]=unitPrice&sort[1][order]=asc

### Filtering
Use the 'filter' parameter with various operators:
- eq: Equal to
- ne: Not equal to
- lt: Less than
- lte: Less than or equal to
- gt: Greater than
- gte: Greater than or equal to
- like: SQL LIKE pattern matching
- in: In a list of values
- nin: Not in a list of values
- is: Is null or not null

Example: ?filter[productName][like]=%Chai%&filter[unitPrice][gte]=10

You can combine multiple filters, sorting, and pagination in a single query.
Example: ?page=1&pageSize=20&sort[0][field]=productName&sort[0][order]=asc&filter[categoryId][eq]=1&filter[unitPrice][gte]=10

## For JavaScript clients
Use the *qs* library to stringify filter/pagination/sort objects.
      `,
    },
    {
      name: "Employee",
      description: "Operations related to employee management.",
    }
  ],
};

export default function configureOpenAPI(app: AppOpenAPI) {
  // Serve OpenAPI spec at /doc with custom tags
  app.doc("/doc", openApiInfo);

  // Endpoint to serve Better Auth OpenAPI schema
  app.get("/doc/auth", async (c) => {
    const authSchema = await auth.api.generateOpenAPISchema();
    return c.json(authSchema);
  });
  // Unified Scalar UI with multiple sources
  app.get(
    "/",
    Scalar({
      pageTitle: env.APP_NAME,
      theme: "purple",
      layout: "modern",
      defaultHttpClient: {
        targetKey: "js",
        clientKey: "fetch",
      },
      sources: [
        { url: "/doc", title: "API" },
        { url: "/doc/auth", title: "Authentication" },
      ],
    })
  );
}
