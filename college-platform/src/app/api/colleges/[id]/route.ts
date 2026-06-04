import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, hydrateCollege } from "@/lib/db";
import type { Review } from "@/lib/types";

const paramsSchema = z.object({ id: z.coerce.number().int().positive() });

export function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const db = getDb();
  const row = db.prepare("SELECT * FROM colleges WHERE id = ?").get(parsed.data.id) as any;
  if (!row) return NextResponse.json({ error: "College not found" }, { status: 404 });

  const reviews = db
    .prepare("SELECT * FROM reviews WHERE collegeId = ? ORDER BY createdAt DESC")
    .all(parsed.data.id) as Review[];

  return NextResponse.json({ data: { ...hydrateCollege(row), reviews } });
}
