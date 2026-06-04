import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, hydrateCollege } from "@/lib/db";
import type { College } from "@/lib/types";

const schema = z.object({
  exam: z.string().min(2).max(60),
  rank: z.coerce.number().int().min(1).max(2_000_000),
  stream: z.string().max(60).optional(),
});

// Maps a rank into an admission probability band per college using rating,
// NIRF rank and selectivity heuristics. Lower rank = stronger candidate.
function chance(college: College, rank: number): number {
  const selectivity = college.nirfRank ? Math.max(1, 200 - college.nirfRank) : 60;
  const ratingFactor = (college.rating - 3) * 30; // 12..54
  // Effective cutoff rank the college typically admits up to.
  const cutoff = 1000 + selectivity * 900 + ratingFactor * 400;
  const ratio = rank / cutoff;
  let p = 100 - ratio * 100;
  p = Math.max(2, Math.min(98, p));
  return Math.round(p);
}

function band(p: number): "High" | "Moderate" | "Low" {
  if (p >= 70) return "High";
  if (p >= 40) return "Moderate";
  return "Low";
}

export function POST(req: NextRequest) {
  return handle(req);
}

async function handle(req: NextRequest) {
  let bodyRaw: unknown;
  try {
    bodyRaw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = schema.safeParse(bodyRaw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { exam, rank, stream } = parsed.data;
  const db = getDb();

  const where: string[] = ["exams LIKE @exam"];
  const params: Record<string, unknown> = { exam: `%${exam}%` };
  if (stream) { where.push("stream = @stream"); params.stream = stream; }

  const rows = db.prepare(`SELECT * FROM colleges WHERE ${where.join(" AND ")}`).all(params) as any[];
  if (rows.length === 0) {
    return NextResponse.json({ data: [], message: `No colleges found accepting ${exam}.` });
  }

  const results = rows
    .map((r) => {
      const college = hydrateCollege(r);
      const probability = chance(college, rank);
      return { college, probability, verdict: band(probability) };
    })
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 12);

  return NextResponse.json({ data: results, query: { exam, rank, stream: stream ?? null } });
}
