import { createRoute, z } from "@hono/zod-openapi";
import {
  listEmployeeQuerySearchSchema,
  listEmployeeSchema,
  insertEmployeeSchema,
  updateEmployeeSchema,
  employeeSchema,
} from "./schema";
import { authMiddleware, roleCheckMiddleware } from "@/middlewares/auth-middleware";
import { idStringParamSchema, ZodBadRequestOpenApi, ZodConflictResponseOpenApi, ZodNotFoundResponseOpenApi } from "@/utils/zod";

const tags = ["Employee"];

export const list = createRoute({
  method: "get",
  path: "/",
  middleware: [roleCheckMiddleware({ roles: ["ADMIN", "HR"] })],
  tags,
  summary: "List employees",
  description:
    "Get a list of employees with filtering, pagination, and sorting",
  request: {
    query: listEmployeeQuerySearchSchema,
  },
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": {
          schema: listEmployeeSchema,
        },
      },
    },
    400: ZodBadRequestOpenApi,
  },
});

export const create_admin = createRoute({
  method: "post",
  path: "/admin",
  middleware: [roleCheckMiddleware({ roles: ["ADMIN"] })],
  tags,
  summary: "Create a new admin account",
  description: "Create a new admin account record",
  request: {
    body: {
      content: {
        "application/json": {
          schema: insertEmployeeSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Employee created successfully",
      content: {
        "application/json": {
          schema: employeeSchema,
        },
      },
    },
    409: ZodConflictResponseOpenApi,
    400: ZodBadRequestOpenApi,
  },
});
export const create_hr = createRoute({
  method: "post",
  path: "/hr",
  middleware: [roleCheckMiddleware({ roles: ["HR", "ADMIN"] })],
  tags,
  summary: "Create a new HR employee",
  description: "Create a new HR employee record",
  request: {
    body: {
      content: {
        "application/json": {
          schema: insertEmployeeSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Employee created successfully",
      content: {
        "application/json": {
          schema: employeeSchema,
        },
      },
    },
    409: ZodConflictResponseOpenApi,
    400: ZodBadRequestOpenApi,
  },
});


export const create_employee = createRoute({
  method: "post",
  path: "/",
  middleware: [roleCheckMiddleware({ roles: ["HR", "ADMIN"] })],
  tags,
  summary: "Create a new employee",
  description: "Create a new employee record",
  request: {
    body: {
      content: {
        "application/json": {
          schema: insertEmployeeSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Employee created successfully",
      content: {
        "application/json": {
          schema: employeeSchema,
        },
      },
    },
    409: ZodConflictResponseOpenApi,
    400: ZodBadRequestOpenApi,
  },
});

export const get = createRoute({
  method: "get",
  path: "/{id}",
  middleware: [authMiddleware],
  tags,
  summary: "Get employee by ID",
  description: "Retrieve an employee record by its ID",
  request: {
    params: idStringParamSchema,
  },
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": {
          schema: employeeSchema,
        },
      },
    },
    404: ZodNotFoundResponseOpenApi,
    400: ZodBadRequestOpenApi,
  },
});

export const get_by_mac_address = createRoute({
  method: "get",
  path: "/mac/{id}",
  middleware: [authMiddleware],
  tags,
  summary: "Get employee by MAC address",
  description: "Retrieve an employee record by its MAC address",
  request: {
    params: idStringParamSchema,
  },
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": {
          schema: employeeSchema,
        },
      },
    },
    404: ZodNotFoundResponseOpenApi,
    400: ZodBadRequestOpenApi,
  },
});

export const update_post = createRoute({
  method: "post",
  path: "/{id}",
  middleware: [authMiddleware],
  tags,
  summary: "Update an existing employee",
  description: "Update an existing employee record by ID",
  request: {
    params: idStringParamSchema,
    body: {
      content: {
        "application/json": {
          schema: updateEmployeeSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Employee updated successfully",
      content: {
        "application/json": {
          schema: employeeSchema,
        },
      },
    },
    400: ZodBadRequestOpenApi,
  },
});

export const update_put = createRoute({
  method: "put",
  path: "/{id}",
  middleware: [authMiddleware],
  tags,
  summary: "Update an existing employee",
  description: "Update an existing employee record by ID",
  request: {
    params: idStringParamSchema,
    body: {
      content: {
        "application/json": {
          schema: updateEmployeeSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Employee updated successfully",
      content: {
        "application/json": {
          schema: employeeSchema,
        },
      },
    },
    400: ZodBadRequestOpenApi,
  },
});

export const remove = createRoute({
  method: "delete",
  path: "/{id}",
  middleware: [roleCheckMiddleware({ roles: ["ADMIN", "HR"] })],
  tags,
  summary: "Delete an employee",
  description: "Delete an existing employee record by ID",
  request: {
    params: idStringParamSchema,
  },
  responses: {
    200: {
      description: "Employee deleted successfully",
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