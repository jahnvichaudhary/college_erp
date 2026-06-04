"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { College } from "@/lib/types";
import { inr, lpa, latestPlacement } from "@/lib/format";
import { useCompare } from "@/components/CompareContext";

function bestIndex(values: number[], higherIsBetter: boolean): number {
  let best = 0;
  for (let i = 1; i < values.length; i++) {
    if (higherIsBetter ? values[i] > values[best] : values[i] < values[best]) best = i;
  }
  return best;
}

function CompareInner() {
  const sp = useSearchParams();
  const { items } = useCompare();
  const idsParam = sp.get("ids");
  const ids = idsParam
    ? idsParam.split(",").map(Number).filter((n) => n > 0)
    : items.map((i) => i.id);

  const [colleges, setColleges] = useState<College[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ids.length < 2) { setColleges([]); return; }
    fetch(`/api/compare?ids=${ids.join(",")}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => setColleges(d.data))
      .catch(() => setError("Could not load the selected colleges."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsParam, items.length]);

  if (ids.length < 2) {
    return (
      <div className="container section">
        <h1>Compare colleges</h1>
        <div className="notice warn">Add at least 2 colleges to compare. <Link href="/">Browse colleges →</Link></div>
      </div>
    );
  }
  if (error) return <div className="container section"><div className="notice warn">{error}</div></div>;
  if (!colleges) return <div className="container section"><div className="skel" style={{ height: 300 }} /></div>;

  const fees = colleges.map((c) => c.annualFee);
  const ratings = colleges.map((c) => c.rating);
  const avg = colleges.map((c) => latestPlacement(c.placements).avgPackageLpa);
  const high = colleges.map((c) => latestPlacement(c.placements).highestPackageLpa);
  const rate = colleges.map((c) => latestPlacement(c.placements).placementRate);

  const rows: { label: string; values: string[]; bestAt?: number }[] = [
    { label: "Location", values: colleges.map((c) => `${c.city}, ${c.state}`) },
    { label: "Type", values: colleges.map((c) => c.type) },
    { label: "Stream", values: colleges.map((c) => c.stream) },
    { label: "NIRF rank", values: colleges.map((c) => (c.nirfRank ? `#${c.nirfRank}` : "—")) },
    { label: "Rating", values: colleges.map((c) => `★ ${c.rating.toFixed(1)}`), bestAt: bestIndex(ratings, true) },
    { label: "Annual fee", values: colleges.map((c) => inr(c.annualFee)), bestAt: bestIndex(fees, false) },
    { label: "Avg package", values: avg.map(lpa), bestAt: bestIndex(avg, true) },
    { label: "Highest package", values: high.map(lpa), bestAt: bestIndex(high, true) },
    { label: "Placement rate", values: rate.map((r) => `${r}%`), bestAt: bestIndex(rate, true) },
    { label: "NAAC grade", values: colleges.map((c) => c.naacGrade) },
  ];

  return (
    <div className="container section">
      <Link href="/" className="muted">← Back to discovery</Link>
      <h1 className="mt">Side-by-side comparison</h1>
      <p className="muted">Highlighted cells mark the best value in each row.</p>

      <div className="table-wrap mt">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              {colleges.map((c) => (
                <th key={c.id}><Link href={`/colleges/${c.id}`}>{c.name}</Link></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td><strong>{row.label}</strong></td>
                {row.values.map((v, i) => (
                  <td key={i} className={row.bestAt === i ? "best" : ""}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="container section"><div className="skel" style={{ height: 300 }} /></div>}>
      <CompareInner />
    </Suspense>
  );
}
