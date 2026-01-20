import { OpenAPIHono } from "@hono/zod-openapi";
import {
  list,
  create_employee,
  update_post,
  update_put,
  remove,
  get,
  create_hr,
  create_admin,
  get_by_mac_address,
} from "./openapi.route";
import { AppBindings } from "@/types/app";
import { advancedQuery } from "@/utils/filter-pagination-sorting";
import { db } from "@/db";
import { account, user } from "@/db/schema";
import { generatePaginationMetadata } from "@/utils/pagination";
import { generateNextEmpId, generateRandomId, generateUID } from "@/utils/gen-id";
import { count, desc, eq } from "drizzle-orm";
import { PasswordUtils } from "@/utils/password";

export const employeeGroup = new OpenAPIHono<AppBindings>()
  .openapi(list, async (c) => {
    const filteringInput = c.req.valid("query");

    const BASE_CONDITION = eq(user.role,"EMPLOYEE");
    const { data, total_items } = await advancedQuery(
      db,
      user,
      filteringInput,
      undefined,
      [{ field: "createdAt", order: "desc" }],
      ["id","email","macAddress", "createdAt"],
      BASE_CONDITION,
      undefined,
      "createdAt"
    );
    const pagination = generatePaginationMetadata(c, total_items);

    return c.json({ success: true, data, pagination }, 200);
  })
  .openapi(create_admin, async (c) => {
    const data = c.req.valid("json");

    const id = generateUID();
    const hashPassword = await PasswordUtils.hash(data.password);

    const [emailExists] = await db
      .select({
        count: count(),
      })
      .from(user)
      .where(eq(user.email, data.email))
      .limit(1);

    if (emailExists.count > 0) {
      return c.json(
        {
          success: false,
          error: {
            name: "EmailExistsError",
            message: "An employee with this email already exists.",
          },
        },
        409
      );
    }


    const [result] = await db
      .insert(user)
      .values({
        id,
        role:"ADMIN",
        ...data,
      })
      .returning({ id: user.id });

    await db.insert(account).values({
      id: generateRandomId(),
      userId: id,
      accountId: generateRandomId(),
      providerId: "credential",
      password: hashPassword,
    });

    return c.json(result, 201);
  })
  .openapi(create_hr, async (c) => {
    const data = c.req.valid("json");

    const id = generateUID();
    const hashPassword = await PasswordUtils.hash(data.password);

    const [emailExists] = await db
      .select({
        count: count(),
      })
      .from(user)
      .where(eq(user.email, data.email))
      .limit(1);

    if (emailExists.count > 0) {
      return c.json(
        {
          success: false,
          error: {
            name: "EmailExistsError",
            message: "An employee with this email already exists.",
          },
        },
        409
      );
    }

    const [result] = await db
      .insert(user)
      .values({
        id,
        role:"HR",
        ...data,
      })
      .returning({ id: user.id });

    await db.insert(account).values({
      id: generateRandomId(),
      userId: id,
      accountId: generateRandomId(),
      providerId: "credential",
      password: hashPassword,
    });

    return c.json(result, 201);
  })
  .openapi(create_employee, async (c) => {
    const data = c.req.valid("json");

    const hashPassword = await PasswordUtils.hash(data.password);

    const [emailExists] = await db
      .select({
        count: count(),
      })
      .from(user)
      .where(eq(user.email, data.email))
      .limit(1);

    if (emailExists.count > 0) {
      return c.json(
        {
          success: false,
          error: {
            name: "EmailExistsError",
            message: "An employee with this email already exists.",
          },
        },
        409
      );
    }

    const [latestEmployee] = await db
      .select()
      .from(user)
      .where(eq(user.role, "EMPLOYEE"))
      .orderBy(desc(user.createdAt))
      .limit(1);

    const id = generateNextEmpId(latestEmployee?.id)

    const [result] = await db
      .insert(user)
      .values({
        id,
        role:"EMPLOYEE",
        ...data,
      })
      .returning({ id: user.id });

    await db.insert(account).values({
      id: generateRandomId(),
      userId: id,
      accountId: generateRandomId(),
      providerId: "credential",
      password: hashPassword,
    });

    return c.json(result, 201);
  })
  .openapi(get_by_mac_address, async (c) => {
    const { id } = c.req.valid("param");

    const employee = await db
      .select()
      .from(user)
      .where(eq(user.macAddress, id))
      .limit(1)
      .then((rows) => rows[0]);

    return c.json(employee, 200);
  })
  .openapi(get, async (c) => {
    const { id } = c.req.valid("param");

    const employee = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    return c.json(employee, 200);
  })
  .openapi(update_put, async (c) => {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");

    const [updatedEmployee] = await db
      .update(user)
      .set(data)
      .where(eq(user.id, id))
      .returning()
      .then((rows) => rows);

    return c.json(updatedEmployee, 200);
  })
  .openapi(update_post, async (c) => {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");

    const [updatedEmployee] = await db
      .update(user)
      .set(data)
      .where(eq(user.id, id))
      .returning()
      .then((rows) => rows);

    return c.json(updatedEmployee, 200);
  })
  .openapi(remove, async (c) => {
    const { id } = c.req.valid("param");

    await db.delete(user).where(eq(user.id, id));

    return c.json({ success: true }, 200);
  });
