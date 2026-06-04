import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, hydrateQuestion } from "@/lib/db";

const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  tag: z.string().max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

const createSchema = z.object({
  title: z.string().trim().min(8).max(160),
  body: z.string().trim().min(15).max(2000),
  author: z.string().trim().min(2).max(60),
  tags: z.array(z.string().trim().min(1).max(30)).max(5).default([]),
  collegeId: z.number().int().positive().nullable().optional(),
});

export function GET(req: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  const f = parsed.data;
  const db = getDb();

  const where: string[] = [];
  const params: Record<string, unknown> = {};
  if (f.q) { where.push("(title LIKE @q OR body LIKE @q)"); params.q = `%${f.q}%`; }
  if (f.tag) { where.push("tags LIKE @tag"); params.tag = `%${f.tag}%`; }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const total = (db.prepare(`SELECT COUNT(*) AS c FROM questions ${whereSql}`).get(params) as { c: number }).c;
  const offset = (f.page - 1) * f.pageSize;
  const rows = db
    .prepare(`SELECT * FROM questions ${whereSql} ORDER BY createdAt DESC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit: f.pageSize, offset }) as any[];

  const countAnswers = db.prepare("SELECT COUNT(*) AS c FROM answers WHERE questionId = ?");
  const data = rows.map((r) => ({
    ...hydrateQuestion(r),
    answerCount: (countAnswers.get(r.id) as { c: number }).c,
  }));

  return NextResponse.json({
    data,
    pagination: { page: f.page, pageSize: f.pageSize, total, totalPages: Math.max(1, Math.ceil(total / f.pageSize)) },
  });
}

export async function POST(req: NextRequest) {
  let bodyRaw: unknown;
  try {
    bodyRaw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(bodyRaw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }
  const db = getDb();
  const v = parsed.data;
  const info = db
    .prepare("INSERT INTO questions (title,body,author,tags,collegeId,createdAt) VALUES (?,?,?,?,?,?)")
    .run(v.title, v.body, v.author, JSON.stringify(v.tags), v.collegeId ?? null, new Date().toISOString());

  const created = db.prepare("SELECT * FROM questions WHERE id = ?").get(info.lastInsertRowid) as any;
  return NextResponse.json({ data: { ...hydrateQuestion(created), answerCount: 0 } }, { status: 201 });
}
