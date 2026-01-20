
import { OpenAPIHono } from "@hono/zod-openapi";
import { employeeGroup } from "./employee/handler";
import { attendanceGroup } from "./attendo/handler";

export const routes = new OpenAPIHono()
  .route("/employees", employeeGroup)    
  .route("/attendance", attendanceGroup);

