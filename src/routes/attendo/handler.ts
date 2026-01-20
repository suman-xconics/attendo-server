import { OpenAPIHono } from "@hono/zod-openapi";
import {
  list,
  create,
  remove,
  list_by_mac,
} from "./openapi.route";
import { AppBindings } from "@/types/app";
import { db } from "@/db";
import { attendo, user } from "@/db/schema";
import { generatePaginationMetadata } from "@/utils/pagination";
import { generateRandomId } from "@/utils/gen-id";
import { and, eq, sql, gte, lte, or, ilike } from "drizzle-orm";

// Define searchable fields as constants
const SEARCHABLE_FIELDS = ["id_value", "person_name"] as const;

export const attendanceGroup = new OpenAPIHono<AppBindings>()
  .openapi(list, async (c) => {
    const filteringInput = c.req.valid("query");
    const {from_date, to_date, search } = filteringInput;

    // Build WHERE conditions dynamically
    const conditions = [];

    // Date range filtering - compare DATE parts directly (timezone safe)
    if (from_date) {
      conditions.push(
        gte(sql`DATE(${attendo.device_time})`, from_date)
      );
    }

    if (to_date) {
      conditions.push(
        lte(sql`DATE(${attendo.device_time})`, to_date)
      );
    }

    // Search filtering on defined searchable fields
    if (search) {
      const searchConditions = SEARCHABLE_FIELDS.map((field) =>
        ilike(attendo[field], `%${search}%`)
      );
      conditions.push(or(...searchConditions));
    }

    // Combine all conditions
    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Query with aggregation to get entry and exit times per day
    const formattedAttendance = await db
      .select({
        row_id: sql<string>`MIN(${attendo.row_id})`.as("row_id"),
        id_value: sql<string>`${attendo.id_value}`.as("id_value"),
        person_name: sql<string>`MAX(${attendo.person_name})`.as("person_name"),
        date: sql<string>`DATE(${attendo.device_time})`.as("date"),
        entry_time: sql<string>`MIN(${attendo.device_time})`.as("entry_time"),
        exit_time: sql<string>`CASE WHEN COUNT(*) > 1 THEN MAX(${attendo.device_time}) ELSE NULL END`.as("exit_time"),
      })
      .from(attendo)
      .where(whereCondition)
      .groupBy(sql`DATE(${attendo.device_time})`, attendo.id_value)
      .orderBy(sql`DATE(${attendo.device_time}) DESC`);

    // Get total count for pagination
    const totalCount = formattedAttendance.length;
    const pagination = generatePaginationMetadata(c, totalCount);

    return c.json({ success: true, data: formattedAttendance, pagination }, 200);
  })

  .openapi(list_by_mac, async (c) => {
    const filteringInput = c.req.valid("query");
    const { id } = c.req.valid("param");
    const { from_date, to_date, search } = filteringInput;

    // Build WHERE conditions dynamically
    const conditions = [];
    conditions.push(eq(attendo.id_value, id));

    // Date range filtering - inclusive of both start and end dates (full 24 hours)
    // If filtering 10-15, includes from 10th 00:00:00 to 15th 23:59:59
    if (from_date) {
      const startDateTime = new Date(from_date);
      startDateTime.setHours(0, 0, 0, 0); // Start of the day
      conditions.push(
        gte(sql`${attendo.device_time}::timestamp`, startDateTime.toISOString())
      );
    }

    if (to_date) {
      const endDateTime = new Date(to_date);
      endDateTime.setHours(23, 59, 59, 999); // End of the day
      conditions.push(
        lte(sql`${attendo.device_time}::timestamp`, endDateTime.toISOString())
      );
    }

    // Search filtering on defined searchable fields
    if (search) {
      const searchConditions = SEARCHABLE_FIELDS.map((field) =>
        ilike(attendo[field], `%${search}%`)
      );
      conditions.push(or(...searchConditions));
    }

    // Combine all conditions
    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Query with aggregation to get entry and exit times per day
    const formattedAttendance = await db
      .select({
        row_id: sql<string>`MIN(${attendo.row_id})`.as("row_id"),
        id_value: sql<string>`${attendo.id_value}`.as("id_value"),
        person_name: sql<string>`MAX(${attendo.person_name})`.as("person_name"),
        date: sql<string>`DATE(${attendo.device_time}::timestamp)`.as("date"),
        entry_time: sql<string>`MIN(${attendo.device_time}::timestamp)`.as("entry_time"),
        exit_time: sql<string>`CASE WHEN COUNT(*) > 1 THEN MAX(${attendo.device_time}::timestamp) ELSE NULL END`.as("exit_time"),
      })
      .from(attendo)
      .where(whereCondition)
      .groupBy(sql`DATE(${attendo.device_time}::timestamp)`, attendo.id_value)
      .orderBy(sql`DATE(${attendo.device_time}::timestamp) DESC`);

    // Get total count for pagination
    const totalCount = formattedAttendance.length;
    const pagination = generatePaginationMetadata(c, totalCount);

    return c.json({ success: true, data: formattedAttendance, pagination }, 200);
  })
  .openapi(create, async (c) => {
    const data = c.req.valid("json");

    const entry_time = new Date(data.entry_time);
    const exit_time = new Date(data.exit_time);
    const macAddress = data.id_value;

    // Get person name from user table
    const userRecord = await db
      .select({ person_name: user.name })
      .from(user)
      .where(eq(user.macAddress, macAddress))
      .limit(1)
      .then((res) => res[0]);

    const person_name = userRecord?.person_name || null;

    // Create two separate records - entry and exit
    const entryId = generateRandomId();
    const exitId = generateRandomId();

    await db.insert(attendo).values([
      {
        row_id: entryId,
        id_value: macAddress,
        person_name: person_name,
        device_time: entry_time.toISOString(),
        received_at: entry_time,
      },
      {
        row_id: exitId,
        id_value: macAddress,
        person_name: person_name,
        device_time: exit_time.toISOString(),
        received_at: exit_time,
      },
    ]);

    // Return formatted response with joined data
    const formattedResponse = {
      row_id: entryId,
      id_value: macAddress,
      person_name: person_name,
      date: new Date(entry_time.toDateString()),
      entry_time: entry_time,
      exit_time: exit_time,
    };

    return c.json(formattedResponse, 201);
  })
  .openapi(remove, async (c) => {
    const id = c.req.param("id");

    const attendanceRecord = await db
      .select()
      .from(attendo)
      .where(eq(attendo.row_id, id))
      .limit(1)
      .then((res) => res[0]);

    if (!attendanceRecord) {
      return c.json(
        {
          success: false,
          error: {
            name: "NotFoundError",
            message: "Attendance record not found.",
          },
        },
        404
      );
    }

    // Delete all records for the same day and id_value
    await db.delete(attendo).where(
      and(
        eq(attendo.id_value, attendanceRecord.id_value),
        sql`DATE(${attendo.device_time}::timestamp) = DATE(${attendanceRecord.device_time}::timestamp)`
      )
    );

    return c.json(
      { success: true, message: "Attendance records deleted for the day." },
      200
    );
  });
