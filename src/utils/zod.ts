import { z } from "@hono/zod-openapi";
import type { z as z4 } from "zod/v4";
import type { ZodObject, ZodRawShape } from "zod";
import { PgTable } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { paginationSchema } from "./pagination";

export function toZodV4SchemaTyped<T extends z4.ZodTypeAny>(schema: T) {
  return schema as unknown as z.ZodType<z4.infer<T>>;
}

export const idNumberParamSchema = z.object({
  id: z.number().int().min(1).pipe(z.coerce.number()),
});

export const idStringParamSchema = z.object({
  id: z.string().min(1),
});
// Simple Zod error schema
export const ZodErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    issues: z.array(
      z.object({
        code: z.string(),
        path: z.array(z.union([z.string(), z.number()])),
        message: z.string(),
      })
    ).optional(),
  }),
});

export const ZodNotFoundSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
  }),
});

export const ZodConflictSchema = z.object({
  success: z.literal(false),
  error: z.object({
    name: z.string(),
    message: z.string(),
  }),
});


export const ZodUnauthorizedSchema = z.object({
  success: z.literal(false),
  error: z.object({
    name: z.string(),
    message: z.string(),
  }),
});

// Simple OpenAPI response
export const ZodBadRequestOpenApi = {
  description: "Validation error",
  content: {
    "application/json": {
      schema: ZodErrorSchema,
    },
  },
};

export const ZodNotFoundResponseOpenApi = {
  description: "Resource not found",
  content: {
    "application/json": {
      schema: ZodNotFoundSchema,
    },
  },
};

export const ZodConflictResponseOpenApi = {
  description: "Conflict error",
  content: {
    "application/json": {
      schema: ZodConflictSchema,
    },
  },
};

export const ZodUnauthorizedResponseOpenApi = {
  description: "Unauthorized error",
  content: {
    "application/json": {
      schema: ZodUnauthorizedSchema,
    },
  },
};


export function insureOneProperty<T extends ZodObject<ZodRawShape>>(zodObj: T) {
  const schema = zodObj;
  schema.refine(
    (obj) => Object.keys(obj).length > 0,
    "at least one property must be defined"
  );
  return schema;
}

export const resourceListSchema = <T extends PgTable>(table: T) => {
  // Create the select schema once and store it
  const selectSchema = createSelectSchema(table);

  return z.object({
    success: z.boolean(),
    pagination: paginationSchema,
    data: z.array(selectSchema),
  });
};

export const resourceListSchemaFromZod = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    success: z.boolean(),
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total_pages: z.number().int(),
      total_items: z.number().int(),
    }),
    data: z.array(schema),
  });
