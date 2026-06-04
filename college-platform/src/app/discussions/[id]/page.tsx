"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Question, Answer } from "@/lib/types";
import { fmtDate } from "@/lib/format";

export default function ThreadPage() {
  const { id } = useParams();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  const [form, setForm] = useState({ author: "", body: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/questions/${id}/answers`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { setQuestion(d.data.question); setAnswers(d.data.answers); setStatus("ok"); })
      .catch(() => setStatus("error"));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (form.author.trim().length < 2) return setFormError("Please add your name.");
    if (form.body.trim().length < 10) return setFormError("Answer must be at least 10 characters.");

    setSubmitting(true);
    try {
      const res = await fetch(`/api/questions/${id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: form.author.trim(), body: form.body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not post your answer.");
      setForm({ author: "", body: "" });
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") return <div className="container section"><div className="skel" style={{ height: 160 }} /></div>;
  if (status === "error" || !question) return (
    <div className="container section"><div className="notice warn">Discussion not found. <Link href="/discussions">Back</Link></div></div>
  );

  return (
    <div className="container section">
      <Link href="/discussions" className="muted">← All discussions</Link>
      <div className="form-card mt">
        <h1>{question.title}</h1>
        <p>{question.body}</p>
        <div className="row spread">
          <div className="tag-row">{question.tags.map((t) => <span key={t} className="chip">#{t}</span>)}</div>
          <span className="muted">Asked by {question.author} · {fmtDate(question.createdAt)}</span>
        </div>
      </div>

      <h2 style={{ marginTop: 28 }}>{answers.length} {answers.length === 1 ? "answer" : "answers"}</h2>
      {answers.map((a) => (
        <div className="q-item" key={a.id}>
          <p style={{ margin: 0 }}>{a.body}</p>
          <div className="row spread mt" style={{ marginTop: 8 }}>
            <span className="muted">{a.author} · {fmtDate(a.createdAt)}</span>
            <span className="chip alt">▲ {a.upvotes}</span>
          </div>
        </div>
      ))}

      <form className="form-card mt" onSubmit={submit}>
        <h3>Your answer</h3>
        <div className="field">
          <label><strong>Name</strong></label>
          <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Your name" />
        </div>
        <div className="field">
          <label><strong>Answer</strong></label>
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Share what you know…" />
        </div>
        {formError && <div className="error-text">{formError}</div>}
        <button className="btn btn-primary" disabled={submitting}>{submitting ? "Posting…" : "Post answer"}</button>
      </form>
    </div>
  );
}
