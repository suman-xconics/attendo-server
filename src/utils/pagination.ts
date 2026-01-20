import { z } from "@hono/zod-openapi";
import type { Context } from "hono";

export const paginationSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total_pages: z.number().int(),
  total_items: z.number().int(),
});

type PaginationMetadata = z.infer<typeof paginationSchema>;

export function generatePaginationMetadata(
  c: Context<any, any, { out: { query: { page: number; limit: number } } }>,
  total_items: number
): PaginationMetadata {
  const { page, limit } = c.req.valid("query");
  const total_pages = Math.ceil(total_items / Number(limit));
  const selfUrl = new URL(c.req.url).href;

  const firstPageUrl = new URL(selfUrl);
  firstPageUrl.searchParams.set("page", "1");

  const lastPageUrl = new URL(selfUrl);
  lastPageUrl.searchParams.set("page", total_pages.toString());

  const nextPageUrl = new URL(selfUrl);
  nextPageUrl.searchParams.set("page", (page + 1).toString());

  const prevPageUrl = new URL(selfUrl);
  prevPageUrl.searchParams.set("page", (page - 1).toString());

  return {
    page,
    limit,
    total_pages,
    total_items,
  };
}
