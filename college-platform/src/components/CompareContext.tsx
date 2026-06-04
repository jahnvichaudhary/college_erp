"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

interface CompareItem {
  id: number;
  name: string;
}

interface CompareCtx {
  items: CompareItem[];
  toggle: (item: CompareItem) => void;
  remove: (id: number) => void;
  clear: () => void;
  has: (id: number) => boolean;
}

const Ctx = createContext<CompareCtx | null>(null);
const KEY = "campuscompass.compare";
const MAX = 3;

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const toggle = useCallback((item: CompareItem) => {
    setItems((prev) => {
      if (prev.some((p) => p.id === item.id)) return prev.filter((p) => p.id !== item.id);
      if (prev.length >= MAX) return prev;
      return [...prev, item];
    });
  }, []);

  const remove = useCallback((id: number) => setItems((prev) => prev.filter((p) => p.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const has = useCallback((id: number) => items.some((p) => p.id === id), [items]);

  return <Ctx.Provider value={{ items, toggle, remove, clear, has }}>{children}</Ctx.Provider>;
}

export function useCompare() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
