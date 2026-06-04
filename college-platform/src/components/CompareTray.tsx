"use client";

import Link from "next/link";
import { useCompare } from "./CompareContext";

export default function CompareTray() {
  const { items, remove, clear } = useCompare();
  if (items.length === 0) return null;

  return (
    <div className="tray">
      <strong style={{ fontSize: "0.85rem" }}>Compare</strong>
      <div className="pills">
        {items.map((i) => (
          <span className="pill" key={i.id}>
            {i.name.length > 22 ? i.name.slice(0, 22) + "…" : i.name}
            <button aria-label="Remove" onClick={() => remove(i.id)}>×</button>
          </span>
        ))}
      </div>
      <Link
        href={`/compare?ids=${items.map((i) => i.id).join(",")}`}
        className="btn btn-accent btn-sm"
        aria-disabled={items.length < 2}
        onClick={(e) => { if (items.length < 2) e.preventDefault(); }}
      >
        Compare {items.length}
      </Link>
      <button className="btn btn-sm" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }} onClick={clear}>
        Clear
      </button>
    </div>
  );
}
