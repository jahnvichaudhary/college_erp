"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import CollegeCard from "@/components/CollegeCard";
import type { College } from "@/lib/types";

interface FilterMeta {
  streams: string[];
  states: string[];
  types: string[];
  exams: string[];
  feeRange: { min: number; max: number };
}

interface ListResponse {
  data: College[];
  pagination: { page: number; total: number; totalPages: number; hasMore: boolean };
}

const initialFilters = {
  q: "",
  stream: "",
  state: "",
  type: "",
  exam: "",
  maxFee: "",
  minRating: "",
  sort: "rating",
};

export default function HomePage() {
  const [meta, setMeta] = useState<FilterMeta | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetch("/api/filters").then((r) => r.json()).then(setMeta).catch(() => {});
  }, []);

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) sp.set(k, String(v)); });
    sp.set("page", String(page));
    sp.set("pageSize", "9");
    return sp.toString();
  }, [filters, page]);

  useEffect(() => {
    setLoading(true);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      fetch(`/api/colleges?${query}`)
        .then((r) => r.json())
        .then((d) => setResult(d))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(debounce.current);
  }, [query]);

  const update = useCallback((key: keyof typeof filters, value: string) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  }, []);

  const pages = result?.pagination.totalPages ?? 1;

  return (
    <>
      <section className="container hero">
        <span className="eyebrow">Discover · Compare · Decide</span>
        <h1>Find the right college without the guesswork.</h1>
        <p>
          Search across {meta ? meta.exams.length : "…"}+ entrance exams and dozens of institutions, then compare
          fees, placements and ratings side by side.
        </p>
        <div className="searchbar">
          <input
            placeholder="Search by college, city or state…"
            value={filters.q}
            onChange={(e) => update("q", e.target.value)}
            aria-label="Search colleges"
          />
          <Link href="/predictor" className="btn btn-accent">Rank predictor →</Link>
        </div>
      </section>

      <section className="container section">
        <div className="layout">
          <aside className="filters">
            <h3>Refine results</h3>
            <div className="field">
              <label>Stream</label>
              <select value={filters.stream} onChange={(e) => update("stream", e.target.value)}>
                <option value="">All streams</option>
                {meta?.streams.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label>State</label>
              <select value={filters.state} onChange={(e) => update("state", e.target.value)}>
                <option value="">All states</option>
                {meta?.states.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Type</label>
              <select value={filters.type} onChange={(e) => update("type", e.target.value)}>
                <option value="">Any type</option>
                {meta?.types.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Entrance exam</label>
              <select value={filters.exam} onChange={(e) => update("exam", e.target.value)}>
                <option value="">Any exam</option>
                {meta?.exams.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Max annual fee (₹)</label>
              <input
                type="number" min={0} placeholder="e.g. 200000"
                value={filters.maxFee} onChange={(e) => update("maxFee", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Minimum rating</label>
              <select value={filters.minRating} onChange={(e) => update("minRating", e.target.value)}>
                <option value="">Any rating</option>
                <option value="4.5">4.5+</option>
                <option value="4">4.0+</option>
                <option value="3.5">3.5+</option>
              </select>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setFilters(initialFilters); setPage(1); }}>
              Reset filters
            </button>
          </aside>

          <div>
            <div className="row spread mt" style={{ marginTop: 0 }}>
              <strong>{result ? result.pagination.total : "…"} colleges</strong>
              <div className="field" style={{ margin: 0, minWidth: 180 }}>
                <select value={filters.sort} onChange={(e) => update("sort", e.target.value)} aria-label="Sort">
                  <option value="rating">Sort: Top rated</option>
                  <option value="fee_asc">Fee: Low to high</option>
                  <option value="fee_desc">Fee: High to low</option>
                  <option value="nirf">NIRF ranking</option>
                  <option value="name">Name (A–Z)</option>
                </select>
              </div>
            </div>

            <div className="grid mt">
              {loading && !result
                ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="card skel" style={{ height: 230 }} />)
                : result?.data.map((c) => <CollegeCard key={c.id} college={c} />)}
            </div>

            {result && result.data.length === 0 && (
              <div className="notice warn mt">No colleges match these filters. Try widening your search.</div>
            )}

            {pages > 1 && (
              <div className="pager">
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                {Array.from({ length: pages }).map((_, i) => (
                  <button key={i} className={page === i + 1 ? "active" : ""} onClick={() => setPage(i + 1)}>
                    {i + 1}
                  </button>
                ))}
                <button disabled={page === pages} onClick={() => setPage((p) => p + 1)}>›</button>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
