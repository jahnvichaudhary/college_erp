import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, hydrateCollege } from "@/lib/db";

const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  stream: z.string().max(60).optional(),
  state: z.string().max(60).optional(),
  type: z.enum(["Government", "Private", "Deemed"]).optional(),
  exam: z.string().max(60).optional(),
  minFee: z.coerce.number().min(0).optional(),
  maxFee: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(["rating", "fee_asc", "fee_desc", "name", "nirf"]).default("rating"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(9),
});

export function GET(req: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", details: parsed.error.flatten() }, { status: 400 });
  }
  const f = parsed.data;
  const db = getDb();

  const where: string[] = [];
  const params: Record<string, unknown> = {};

  if (f.q) {
    where.push("(name LIKE @q OR city LIKE @q OR state LIKE @q)");
    params.q = `%${f.q}%`;
  }
  if (f.stream) { where.push("stream = @stream"); params.stream = f.stream; }
  if (f.state) { where.push("state = @state"); params.state = f.state; }
  if (f.type) { where.push("type = @type"); params.type = f.type; }
  if (f.exam) { where.push("exams LIKE @exam"); params.exam = `%${f.exam}%`; }
  if (f.minFee !== undefined) { where.push("annualFee >= @minFee"); params.minFee = f.minFee; }
  if (f.maxFee !== undefined) { where.push("annualFee <= @maxFee"); params.maxFee = f.maxFee; }
  if (f.minRating !== undefined) { where.push("rating >= @minRating"); params.minRating = f.minRating; }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const orderSql = {
    rating: "rating DESC, reviewCount DESC",
    fee_asc: "annualFee ASC",
    fee_desc: "annualFee DESC",
    name: "name ASC",
    nirf: "nirfRank IS NULL, nirfRank ASC",
  }[f.sort];

  const total = (db.prepare(`SELECT COUNT(*) AS c FROM colleges ${whereSql}`).get(params) as { c: number }).c;
  const offset = (f.page - 1) * f.pageSize;

  const rows = db
    .prepare(`SELECT * FROM colleges ${whereSql} ORDER BY ${orderSql} LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit: f.pageSize, offset }) as any[];

  return NextResponse.json({
    data: rows.map(hydrateCollege),
    pagination: {
      page: f.page,
      pageSize: f.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / f.pageSize)),
      hasMore: offset + rows.length < total,
    },
  });
}
