import { createRoute, z } from "@hono/zod-openapi";
import {
  insertAttendanceSchema,
  listAttendanceQuerySearchSchema,
  listAttendanceSchema,
  formatedAttendenceSchema,
} from "./schema";
import { roleCheckMiddleware, sessionMiddleware } from "@/middlewares/auth-middleware";
import { idStringParamSchema, ZodBadRequestOpenApi, ZodConflictResponseOpenApi, ZodNotFoundResponseOpenApi, ZodUnauthorizedResponseOpenApi } from "@/utils/zod";

const tags = ["Attendance"];

export const list = createRoute({
  method: "get",
  path: "/",
  middleware: [roleCheckMiddleware({ roles: ["ADMIN", "HR"] })],
  tags,
  summary: "List attendances",
  description:
    "Get a list of attendances with filtering, pagination, and sorting",
  request: {
    query: listAttendanceQuerySearchSchema,
  },
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": {
          schema: listAttendanceSchema,
        },
      },
    },
    400: ZodBadRequestOpenApi,
  },
});
export const list_by_mac = createRoute({
  method: "get",
  path: "/mac/{id}",
  middleware: [roleCheckMiddleware({ roles: ["ADMIN", "HR"] })],
  tags,
  summary: "List attendances by MAC address",
  description:
    "Get a list of attendances filtered by MAC address with pagination and sorting",
  request: {
    params: idStringParamSchema,
    query: listAttendanceQuerySearchSchema,
  },
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": {
          schema: listAttendanceSchema,
        },
      },
    },
    400: ZodBadRequestOpenApi,
  },
});



export const create = createRoute({
  method: "post",
  path: "/",
  tags,
  summary: "Create new attendance record",
  description: "Create a new attendance record",
  request: {
    body: {
      content: {
        "application/json": {
          schema: insertAttendanceSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Attendance record created successfully",
      content: {
        "application/json": {
          schema: formatedAttendenceSchema,
        },
      },
    },
    409: ZodConflictResponseOpenApi,
    400: ZodBadRequestOpenApi,
  },
});


export const remove = createRoute({
  method: "delete",
  path: "/{id}",
  middleware: [sessionMiddleware],
  tags,
  summary: "Delete an attendance record",
  description: "Delete an existing attendance record by ID",
  request: {
    params: idStringParamSchema,
  },
  responses: {
    200: {
      description: "Attendance record deleted successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
    404: ZodNotFoundResponseOpenApi,
    400: ZodBadRequestOpenApi,
  },
});
