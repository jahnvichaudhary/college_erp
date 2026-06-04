import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Returns the distinct filter values so the UI never hardcodes options.
export function GET() {
  const db = getDb();
  const streams = (db.prepare("SELECT DISTINCT stream FROM colleges ORDER BY stream").all() as { stream: string }[]).map((r) => r.stream);
  const states = (db.prepare("SELECT DISTINCT state FROM colleges ORDER BY state").all() as { state: string }[]).map((r) => r.state);
  const types = (db.prepare("SELECT DISTINCT type FROM colleges ORDER BY type").all() as { type: string }[]).map((r) => r.type);

  const examRows = db.prepare("SELECT exams FROM colleges").all() as { exams: string }[];
  const examSet = new Set<string>();
  for (const r of examRows) (JSON.parse(r.exams) as string[]).forEach((e) => examSet.add(e));

  const feeRow = db.prepare("SELECT MIN(annualFee) AS min, MAX(annualFee) AS max FROM colleges").get() as { min: number; max: number };

  return NextResponse.json({
    streams,
    states,
    types,
    exams: [...examSet].sort(),
    feeRange: { min: feeRow.min, max: feeRow.max },
  });
}
