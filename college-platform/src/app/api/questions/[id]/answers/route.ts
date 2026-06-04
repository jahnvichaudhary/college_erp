import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, hydrateQuestion } from "@/lib/db";
import type { Answer } from "@/lib/types";

const idSchema = z.object({ id: z.coerce.number().int().positive() });
const answerSchema = z.object({
  author: z.string().trim().min(2).max(60),
  body: z.string().trim().min(10).max(2000),
});

export function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = idSchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const db = getDb();

  const question = db.prepare("SELECT * FROM questions WHERE id = ?").get(parsed.data.id) as any;
  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const answers = db
    .prepare("SELECT * FROM answers WHERE questionId = ? ORDER BY upvotes DESC, createdAt ASC")
    .all(parsed.data.id) as Answer[];

  return NextResponse.json({
    data: { question: { ...hydrateQuestion(question), answerCount: answers.length }, answers },
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = idSchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let bodyRaw: unknown;
  try {
    bodyRaw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const body = answerSchema.safeParse(bodyRaw);
  if (!body.success) {
    return NextResponse.json({ error: "Validation failed", details: body.error.flatten() }, { status: 422 });
  }

  const db = getDb();
  const exists = db.prepare("SELECT id FROM questions WHERE id = ?").get(parsed.data.id);
  if (!exists) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const info = db
    .prepare("INSERT INTO answers (questionId,author,body,upvotes,createdAt) VALUES (?,?,?,0,?)")
    .run(parsed.data.id, body.data.author, body.data.body, new Date().toISOString());

  const created = db.prepare("SELECT * FROM answers WHERE id = ?").get(info.lastInsertRowid) as Answer;
  return NextResponse.json({ data: created }, { status: 201 });
}
