"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { College, Review } from "@/lib/types";
import { inr, inrShort, lpa, fmtDate, latestPlacement } from "@/lib/format";
import { useCompare } from "@/components/CompareContext";

type Detail = College & { reviews: Review[] };
const TABS = ["Overview", "Courses", "Placements", "Reviews"] as const;

export default function CollegeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [college, setCollege] = useState<Detail | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const { toggle, has } = useCompare();

  useEffect(() => {
    fetch(`/api/colleges/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { setCollege(d.data); setStatus("ok"); })
      .catch(() => setStatus("error"));
  }, [id]);

  if (status === "loading") return <div className="container section"><div className="skel" style={{ height: 200 }} /></div>;
  if (status === "error" || !college) return (
    <div className="container section">
      <div className="notice warn">College not found. <Link href="/">Back to discovery</Link></div>
    </div>
  );

  const latest = latestPlacement(college.placements);

  return (
    <div className="container section">
      <Link href="/" className="muted">← All colleges</Link>

      <div className="detail-hero mt">
        <div className="row spread">
          <div>
            <div className="row" style={{ gap: 8 }}>
              <span className="chip alt">{college.stream}</span>
              <span className="chip">{college.type}</span>
              {college.nirfRank && <span className="chip">NIRF #{college.nirfRank}</span>}
            </div>
            <h1 style={{ marginTop: 10 }}>{college.name}</h1>
            <div className="muted">📍 {college.city}, {college.state} · Estd. {college.established} · NAAC {college.naacGrade}</div>
          </div>
          <span className="rating" style={{ fontSize: "1rem" }}>★ {college.rating.toFixed(1)} ({college.reviewCount})</span>
        </div>
        <div className="row mt">
          <button
            className={`btn btn-sm ${has(college.id) ? "btn-accent" : "btn-ghost"}`}
            style={{ background: has(college.id) ? undefined : "rgba(255,255,255,0.12)", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}
            onClick={() => toggle({ id: college.id, name: college.name })}
          >
            {has(college.id) ? "✓ Added to compare" : "+ Add to compare"}
          </button>
        </div>
      </div>

      <div className="panel-grid mt">
        <div className="kpi"><div className="num">{inrShort(college.annualFee)}</div><div className="muted">Annual fee</div></div>
        <div className="kpi"><div className="num">{lpa(latest.avgPackageLpa)}</div><div className="muted">Avg package ({latest.year})</div></div>
        <div className="kpi"><div className="num">{latest.placementRate}%</div><div className="muted">Placement rate</div></div>
        <div className="kpi"><div className="num">{college.campusSizeAcres}</div><div className="muted">Campus (acres)</div></div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="form-card">
          <p>{college.overview}</p>
          <div className="panel-grid">
            <div><strong>Accepted exams</strong><div className="tag-row mt">{college.exams.map((e) => <span key={e} className="chip">{e}</span>)}</div></div>
            <div><strong>Hostel</strong><p className="muted">{college.hostelAvailable ? "Available on campus" : "Not available"}</p></div>
            <div><strong>Established</strong><p className="muted">{college.established}</p></div>
          </div>
        </div>
      )}

      {tab === "Courses" && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Course</th><th>Degree</th><th>Duration</th><th>Annual fee</th><th>Seats</th></tr></thead>
            <tbody>
              {college.courses.map((c) => (
                <tr key={c.name}>
                  <td>{c.name}</td><td>{c.degree}</td><td>{c.durationYears} yrs</td>
                  <td>{inr(c.annualFee)}</td><td>{c.seats}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Placements" && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Year</th><th>Avg package</th><th>Highest</th><th>Placement rate</th><th>Top recruiters</th></tr></thead>
            <tbody>
              {[...college.placements].sort((a, b) => b.year - a.year).map((p) => (
                <tr key={p.year}>
                  <td>{p.year}</td><td>{lpa(p.avgPackageLpa)}</td><td>{lpa(p.highestPackageLpa)}</td>
                  <td>{p.placementRate}%</td><td>{p.topRecruiters.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Reviews" && (
        <div className="form-card">
          {college.reviews.length === 0 && <p className="muted">No reviews yet.</p>}
          {college.reviews.map((r) => (
            <div className="review" key={r.id}>
              <div className="row spread">
                <strong>{r.title}</strong>
                <span className="rating">★ {r.rating.toFixed(1)}</span>
              </div>
              <p className="muted" style={{ margin: "4px 0" }}>{r.author} · {r.batch} · {fmtDate(r.createdAt)}</p>
              <p style={{ margin: 0 }}>{r.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
