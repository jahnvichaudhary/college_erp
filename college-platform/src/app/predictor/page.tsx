"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { College } from "@/lib/types";
import { inrShort, lpa, latestPlacement } from "@/lib/format";

interface Prediction {
  college: College;
  probability: number;
  verdict: "High" | "Moderate" | "Low";
}

export default function PredictorPage() {
  const [exams, setExams] = useState<string[]>([]);
  const [exam, setExam] = useState("");
  const [rank, setRank] = useState("");
  const [results, setResults] = useState<Prediction[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/filters").then((r) => r.json()).then((d) => {
      setExams(d.exams);
      setExam(d.exams[0] ?? "");
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const rankNum = Number(rank);
    if (!exam) return setError("Please choose an exam.");
    if (!Number.isInteger(rankNum) || rankNum < 1) return setError("Enter a valid rank (a positive whole number).");

    setLoading(true);
    try {
      const res = await fetch("/api/predictor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam, rank: rankNum }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prediction failed");
      setResults(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container section">
      <span className="eyebrow">Admission predictor</span>
      <h1>Where can your rank take you?</h1>
      <p className="muted" style={{ maxWidth: "60ch" }}>
        Enter your entrance exam and rank. We estimate admission chances using each college&apos;s rating,
        NIRF standing and historical selectivity.
      </p>

      <form className="form-card mt" onSubmit={submit}>
        <div className="form-row">
          <div>
            <label htmlFor="exam"><strong>Entrance exam</strong></label>
            <select id="exam" value={exam} onChange={(e) => setExam(e.target.value)}>
              {exams.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="rank"><strong>Your rank</strong></label>
            <input id="rank" type="number" min={1} placeholder="e.g. 4500" value={rank} onChange={(e) => setRank(e.target.value)} />
          </div>
        </div>
        {error && <div className="error-text">{error}</div>}
        <div className="mt">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Predicting…" : "Predict colleges"}
          </button>
        </div>
      </form>

      {results && (
        <div className="mt">
          {results.length === 0 ? (
            <div className="notice warn">No colleges accept this exam in our dataset. Try another exam.</div>
          ) : (
            <>
              <h2 style={{ marginTop: 24 }}>{results.length} matches for {exam}, rank {rank}</h2>
              <div className="grid mt">
                {results.map((r) => {
                  const p = latestPlacement(r.college.placements);
                  return (
                    <article className="card" key={r.college.id}>
                      <div className="card-head">
                        <h3><Link href={`/colleges/${r.college.id}`}>{r.college.name}</Link></h3>
                        <span className={`badge-verdict v-${r.verdict}`}>{r.verdict}</span>
                      </div>
                      <div className="muted">📍 {r.college.city}, {r.college.state}</div>
                      <div className="row spread">
                        <span className="muted">Admission chance</span>
                        <strong>{r.probability}%</strong>
                      </div>
                      <div style={{ height: 8, background: "var(--line)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: `${r.probability}%`, height: "100%", background: "var(--brand)" }} />
                      </div>
                      <div className="stat-line"><span className="muted">Fee</span><strong>{inrShort(r.college.annualFee)}</strong></div>
                      <div className="stat-line"><span className="muted">Avg package</span><strong>{lpa(p.avgPackageLpa)}</strong></div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
