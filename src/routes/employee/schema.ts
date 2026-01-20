import { user } from "@/db/schema";
import { generateFPSSchemaForTable } from "@/utils/filter-pagination-sorting";
import { insureOneProperty, resourceListSchema } from "@/utils/zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

const baseInsertEmployeeSchema = createInsertSchema(user).omit({
  id: true,
  role: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeSchema = insureOneProperty(baseInsertEmployeeSchema).extend({
  password: z.string(),
});


export const updateEmployeeSchema = insureOneProperty(
  baseInsertEmployeeSchema.partial()
);

export const employeeSchema = createSelectSchema(user).partial();

export const listEmployeeSchema = resourceListSchema(user);

export const listEmployeeQuerySearchSchema =
  generateFPSSchemaForTable(user);
