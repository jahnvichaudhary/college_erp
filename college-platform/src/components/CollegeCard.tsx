"use client";

import Link from "next/link";
import type { College } from "@/lib/types";
import { inrShort, lpa, latestPlacement } from "@/lib/format";
import { useCompare } from "./CompareContext";

export default function CollegeCard({ college }: { college: College }) {
  const { toggle, has } = useCompare();
  const p = latestPlacement(college.placements);
  const selected = has(college.id);

  return (
    <article className="card">
      <div className="card-head">
        <div>
          <h3>
            <Link href={`/colleges/${college.id}`}>{college.name}</Link>
          </h3>
          <div className="muted">📍 {college.city}, {college.state}</div>
        </div>
        <span className="rating">★ {college.rating.toFixed(1)}</span>
      </div>

      <div className="tag-row">
        <span className="chip alt">{college.stream}</span>
        <span className="chip">{college.type}</span>
        {college.nirfRank && <span className="chip">NIRF #{college.nirfRank}</span>}
      </div>

      <div>
        <div className="stat-line"><span className="muted">Annual fee</span><strong>{inrShort(college.annualFee)}</strong></div>
        <div className="stat-line"><span className="muted">Avg package ({p.year})</span><strong>{lpa(p.avgPackageLpa)}</strong></div>
        <div className="stat-line"><span className="muted">Placement rate</span><strong>{p.placementRate}%</strong></div>
      </div>

      <div className="card-foot">
        <Link href={`/colleges/${college.id}`} className="btn btn-primary btn-sm grow">View details</Link>
        <button
          className={`btn btn-sm ${selected ? "btn-accent" : "btn-ghost"}`}
          onClick={() => toggle({ id: college.id, name: college.name })}
        >
          {selected ? "✓ Added" : "+ Compare"}
        </button>
      </div>
    </article>
  );
}
