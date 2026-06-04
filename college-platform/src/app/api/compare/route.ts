import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, hydrateCollege } from "@/lib/db";

const schema = z.object({
  ids: z.string().refine((v) => {
    const parts = v.split(",").map((x) => Number(x.trim()));
    return parts.length >= 2 && parts.length <= 3 && parts.every((n) => Number.isInteger(n) && n > 0);
  }, "Provide 2 to 3 valid college ids"),
});

export function GET(req: NextRequest) {
  const parsed = schema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }
  const ids = parsed.data.ids.split(",").map((x) => Number(x.trim()));
  const db = getDb();
  const placeholders = ids.map(() => "?").join(",");
  const rows = db.prepare(`SELECT * FROM colleges WHERE id IN (${placeholders})`).all(...ids) as any[];

  if (rows.length !== ids.length) {
    return NextResponse.json({ error: "One or more colleges not found" }, { status: 404 });
  }
  const ordered = ids.map((id) => hydrateCollege(rows.find((r) => r.id === id)));
  return NextResponse.json({ data: ordered });
}
