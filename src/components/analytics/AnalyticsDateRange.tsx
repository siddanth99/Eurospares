"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

interface AnalyticsDateRangeProps {
  currentRange: "7" | "30" | "custom";
  start?: string;
  end?: string;
}

export default function AnalyticsDateRange({
  currentRange,
  start: initialStart,
  end: initialEnd,
}: AnalyticsDateRangeProps) {
  const router = useRouter();
  const [start, setStart] = useState(initialStart ?? "");
  const [end, setEnd] = useState(initialEnd ?? "");

  const applyCustom = useCallback(() => {
    if (start && end) {
      router.push(`/analytics?start=${start}&end=${end}`);
    }
  }, [router, start, end]);

  const base =
    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors border border-slate-200";
  const active = "bg-indigo-600 text-white border-indigo-600";
  const inactive = "bg-white text-slate-700 hover:bg-slate-50";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/analytics"
        className={`${base} ${currentRange === "7" ? active : inactive}`}
      >
        7 Days
      </Link>
      <Link
        href="/analytics?range=30"
        className={`${base} ${currentRange === "30" ? active : inactive}`}
      >
        30 Days
      </Link>
      <span className={`${base} ${currentRange === "custom" ? active : inactive}`}>
        Custom
      </span>
      <div className="flex items-center gap-2 ml-2">
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="rounded-md border border-slate-200 px-2 py-1.5 text-sm"
          aria-label="Start date"
        />
        <span className="text-slate-400 text-sm">–</span>
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="rounded-md border border-slate-200 px-2 py-1.5 text-sm"
          aria-label="End date"
        />
        <button
          type="button"
          onClick={applyCustom}
          className="rounded-md px-3 py-1.5 text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
