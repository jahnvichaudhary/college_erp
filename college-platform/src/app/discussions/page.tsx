"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Question } from "@/lib/types";
import { fmtDate } from "@/lib/format";

export default function DiscussionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({ title: "", body: "", author: "", tags: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    fetch(`/api/questions?${sp.toString()}`)
      .then((r) => r.json())
      .then((d) => setQuestions(d.data))
      .finally(() => setLoading(false));
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (form.title.trim().length < 8) return setFormError("Title must be at least 8 characters.");
    if (form.body.trim().length < 15) return setFormError("Please add a bit more detail (15+ characters).");
    if (form.author.trim().length < 2) return setFormError("Please add your name.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          body: form.body.trim(),
          author: form.author.trim(),
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not post your question.");
      setForm({ title: "", body: "", author: "", tags: "" });
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container section">
      <div className="row spread">
        <div>
          <span className="eyebrow">Community Q&amp;A</span>
          <h1>Ask students. Get real answers.</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Close" : "Ask a question"}
        </button>
      </div>

      {showForm && (
        <form className="form-card mt" onSubmit={submit}>
          <div className="field">
            <label><strong>Question title</strong></label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. How are CS placements at private colleges?" />
          </div>
          <div className="field">
            <label><strong>Details</strong></label>
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Share context so people can help you better…" />
          </div>
          <div className="form-row">
            <div className="field">
              <label><strong>Your name</strong></label>
              <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="e.g. Riya" />
            </div>
            <div className="field">
              <label><strong>Tags (comma separated)</strong></label>
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="placements, hostel" />
            </div>
          </div>
          {formError && <div className="error-text">{formError}</div>}
          <button className="btn btn-primary" disabled={submitting}>{submitting ? "Posting…" : "Post question"}</button>
        </form>
      )}

      <div className="searchbar mt" style={{ boxShadow: "none" }}>
        <input placeholder="Search discussions…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search discussions" />
      </div>

      <div className="mt">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="q-item skel" style={{ height: 90 }} />)
        ) : questions.length === 0 ? (
          <div className="notice warn">No discussions yet. Be the first to ask!</div>
        ) : (
          questions.map((quest) => (
            <Link key={quest.id} href={`/discussions/${quest.id}`} className="q-item" style={{ display: "block" }}>
              <h3>{quest.title}</h3>
              <p className="muted" style={{ margin: "4px 0" }}>{quest.body.slice(0, 140)}{quest.body.length > 140 ? "…" : ""}</p>
              <div className="row spread">
                <div className="tag-row">{quest.tags.map((t) => <span key={t} className="chip">#{t}</span>)}</div>
                <span className="muted">{quest.answerCount} answers · {quest.author} · {fmtDate(quest.createdAt)}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
