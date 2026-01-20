import { attendo } from "@/db/schema";
import { generateFPSSchemaForTable } from "@/utils/filter-pagination-sorting";
import { insureOneProperty, resourceListSchema, resourceListSchemaFromZod } from "@/utils/zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

const baseInsertAttendance = createInsertSchema(attendo).omit({
  row_id: true,
  received_at: true,
  person_name: true,
  device_time: true,
  rssi: true,
}).extend({
  entry_time: z.coerce.date(),
  exit_time: z.coerce.date(),
});

export const insertAttendanceSchema = insureOneProperty(baseInsertAttendance)

export const updateAttendanceSchema = insureOneProperty(
  baseInsertAttendance.partial().extend({
    entry_time: z.coerce.date().optional(),
    exit_time: z.coerce.date().optional(),
  })
);


export const formatedAttendenceSchema = z.object({
  row_id: z.string(),
  id_value: z.string().nullable(),
  person_name: z.string().nullable(),
  date: z.coerce.date().nullable(),
  entry_time: z.coerce.date().nullable(),
  exit_time: z.coerce.date().nullable(),
})

export const listAttendanceSchema = resourceListSchemaFromZod(formatedAttendenceSchema);

export const listAttendanceQuerySearchSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  sort_by: z.string().optional().default("date"),
  sort_order: z.enum(["asc", "desc"]).optional().default("desc"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  search: z.string().optional(),
})
