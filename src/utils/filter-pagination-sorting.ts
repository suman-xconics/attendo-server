/**
 * Helper utilities for filtering, pagination and sorting with Drizzle ORM
 * @module filter-pagination-sorting
 */

import { z } from "@hono/zod-openapi";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  ne,
  notInArray,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgColumn, PgTable, TableConfig } from "drizzle-orm/pg-core";

/**
 * Type representing a Drizzle table with proper constraints
 */
type DrizzleTable = PgTable<TableConfig>;

/**
 * Configuration for default sorting behavior
 */
type DefaultSortConfig<T extends DrizzleTable> = ReadonlyArray<{
  readonly field: keyof T["$inferSelect"];
  readonly order?: "asc" | "desc";
}>;

/**
 * List of columns that can be searched
 */
type SearchableColumnsConfig<T extends DrizzleTable> = ReadonlyArray<
  keyof T["$inferSelect"]
>;

/**
 * Filter operators schema
 */
const filterOperatorsSchema = z.object({
  eq: z.string().optional(),
  ne: z.string().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  like: z.string().optional(),
  ilike: z.string().optional(),
  in: z.array(z.string()).optional(),
  nin: z.array(z.string()).optional(),
  is: z.enum(["null", "notnull"]).optional(),
});

export type FilterOperators = z.infer<typeof filterOperatorsSchema>;
export type FilterConfig = Record<string, FilterOperators>;

/**
 * Schema for filtering, pagination and sorting query parameters
 */
export type AdvancedQuerySchema = {
  page: number;
  limit: number;
  search: string;
  from_date: string;
  to_date: string;
  sort_by: string;
  sort_order: "asc" | "desc";
  filter?: FilterConfig;
};

/**
 * Result type from advancedQuery function
 */
export type AdvancedQueryResult<T> = {
  data: T[];
  total_items: number;
};

/**
 * Join configuration type for left joins
 */
export type JoinConfig<TSchema extends Record<string, unknown>> = Array<{
  table: PgTable<TableConfig>;
  on: SQL;
}>;

export function generateFPSSchemaForTable(_table: DrizzleTable) {
  return z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(10),
    search: z.string().optional().default(""),
    from_date: z.string().optional().default(""),
    to_date: z.string().optional().default(""),
    sort_by: z.string().optional().default("created_at"),
    // ✅ FIX: Use z.union() instead of z.enum()
    sort_order: z.union([z.literal("asc"), z.literal("desc")]).optional().default("desc"),
    filter: z.record(z.string(), filterOperatorsSchema).optional(),
  });
}

/**
 * Determines the sort field and order based on input and defaults
 */
function resolveSortConfig<T extends DrizzleTable>(
  fps: AdvancedQuerySchema,
  defaultSort?: DefaultSortConfig<T>
): { field: string; order: "asc" | "desc" } {
  if (fps.sort_by && fps.sort_by.trim() !== "") {
    return {
      field: fps.sort_by,
      order: fps.sort_order,
    };
  }

  if (defaultSort?.length) {
    return {
      field: defaultSort[0].field as string,
      order: defaultSort[0].order ?? "desc",
    };
  }

  return {
    field: "createdAt",
    order: "desc",
  };
}

/**
 * Builds search filter SQL conditions across multiple columns
 */
/**
 * Normalizes search text for better matching
 * - Trims whitespace
 * - Removes multiple spaces
 * - Handles special characters like slashes, hyphens
 */
function normalizeSearchText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .toLowerCase();
}

/**
 * Builds search filter SQL conditions across multiple columns
 * Supports various search patterns including special characters
 */
function buildSearchFilters<T extends DrizzleTable>(
  table: T,
  searchTerm: string,
  searchableColumns?: SearchableColumnsConfig<T>
): SQL | null {
  if (!searchableColumns?.length || !searchTerm.trim()) {
    return null;
  }

  const normalizedTerm = normalizeSearchText(searchTerm);
  const searchPattern = `%${normalizedTerm}%`;
  const conditions: SQL[] = [];
  const tableColumns = table as unknown as Record<string, PgColumn | undefined>;

  for (const columnName of searchableColumns) {
    const column = tableColumns[String(columnName)];
    if (column) {
      // Case-insensitive search with normalized pattern
      conditions.push(ilike(column, searchPattern));
    }
  }

  return conditions.length > 0 ? (or(...conditions) ?? null) : null;
}

/**
 * Builds date range filter SQL conditions
 */
function buildDateRangeFilters<T extends DrizzleTable>(
  table: T,
  fromDate?: string,
  toDate?: string,
  dateColumnName: string = "created_at"
): SQL[] {
  const filters: SQL[] = [];
  const tableColumns = table as unknown as Record<string, PgColumn | undefined>;
  const dateColumn = tableColumns[dateColumnName];

  if (!dateColumn) return filters;

  if (fromDate?.trim()) {
    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);
    filters.push(gte(dateColumn, start));
  }

  if (toDate?.trim()) {
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);
    filters.push(lte(dateColumn, end));
  }

  return filters;
}

/**
 * Builds filter SQL conditions based on filter config
 */
function buildColumnFilters<T extends DrizzleTable>(
  table: T,
  filterConfig?: FilterConfig
): SQL[] {
  if (!filterConfig) return [];

  const filters: SQL[] = [];
  const tableColumns = table as unknown as Record<string, PgColumn | undefined>;

  for (const [fieldName, operators] of Object.entries(filterConfig)) {
    const column = tableColumns[fieldName];
    if (!column) continue;

    if (operators.eq !== undefined) filters.push(eq(column, operators.eq));
    if (operators.ne !== undefined) filters.push(ne(column, operators.ne));
    if (operators.lt !== undefined) filters.push(lt(column, operators.lt));
    if (operators.lte !== undefined) filters.push(lte(column, operators.lte));
    if (operators.gt !== undefined) filters.push(gt(column, operators.gt));
    if (operators.gte !== undefined) filters.push(gte(column, operators.gte));
    if (operators.like !== undefined) filters.push(like(column, operators.like));
    if (operators.ilike !== undefined) filters.push(ilike(column, operators.ilike));
    if (operators.in?.length) filters.push(inArray(column, operators.in));
    if (operators.nin?.length) filters.push(notInArray(column, operators.nin));
    if (operators.is !== undefined) {
      filters.push(operators.is === "null" ? isNull(column) : isNotNull(column));
    }
  }

  return filters;
}

/**
 * Advanced query function with filtering, pagination, sorting, and JOIN support
 */
export async function advancedQuery<
  TSchema extends Record<string, unknown>,
  T extends DrizzleTable,
  TData = any,
>(
  db: NodePgDatabase<TSchema>,
  table: T,
  fps: AdvancedQuerySchema,
  selectColumns?: Record<string, PgColumn>,
  defaultSort?: DefaultSortConfig<T>,
  searchableColumns?: SearchableColumnsConfig<T>,
  baseCondition?: SQL,
  joins?: JoinConfig<TSchema>,
  dateColumnName: string = "createdAt"
): Promise<AdvancedQueryResult<TData>> {
  // Build base select query
  let baseSelect = selectColumns
    ? db.select(selectColumns as any).from(table as any)
    : db.select().from(table as any);

  // Apply joins
  if (joins?.length) {
    for (const join of joins) {
      baseSelect = (baseSelect as any).leftJoin(join.table, join.on);
    }
  }

  // Build data query with pagination
  let dataQuery = baseSelect
    .$dynamic()
    .limit(fps.limit)
    .offset((fps.page - 1) * fps.limit);

  // Build count query
  const primaryKey = Object.values(table)[0] as PgColumn | undefined;
  let countQuery = db
    .select({ totalCount: sql<number>`count(DISTINCT ${primaryKey || sql`1`})` })
    .from(table as any)
    .$dynamic();

  // Apply joins to count query
  if (joins?.length) {
    for (const join of joins) {
      countQuery = (countQuery as any).leftJoin(join.table, join.on);
    }
  }

  // Build all filters
  const filters: SQL[] = [];

  if (baseCondition) filters.push(baseCondition);

  const searchFilter = buildSearchFilters(table, fps.search.trim(), searchableColumns);
  if (searchFilter) filters.push(searchFilter);

  filters.push(...buildDateRangeFilters(table, fps.from_date, fps.to_date, dateColumnName));
  filters.push(...buildColumnFilters(table, fps.filter));

  // Apply sorting
  const sortConfig = resolveSortConfig(fps, defaultSort);
  const tableColumns = table as unknown as Record<string, PgColumn | undefined>;
  const sortColumn = tableColumns[sortConfig.field];

  if (sortColumn) {
    dataQuery = dataQuery.orderBy(
      sortConfig.order === "asc" ? asc(sortColumn) : desc(sortColumn)
    );
  }

  // Apply all filters to both queries
  if (filters.length > 0) {
    const combinedFilters = and(...filters);
    if (combinedFilters) {
      dataQuery = dataQuery.where(combinedFilters);
      countQuery = countQuery.where(combinedFilters);
    }
  }

  // Execute queries in parallel for better performance
  const [data, countResult] = await Promise.all([dataQuery, countQuery]);

  return {
    data: data as TData[],
    total_items: countResult[0]?.totalCount ?? 0,
  };
}
