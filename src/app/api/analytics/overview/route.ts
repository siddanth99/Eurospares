import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { createServerClientForRoute } from "@/src/lib/supabase/route-handler";

const STATUS_KEYS = [
  "new",
  "waiting_price",
  "price_received",
  "customer_informed",
  "confirmed",
  "closed",
] as const;

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function generateDateRange(startStr: string, endStr: string): string[] {
  const result: string[] = [];
  const start = new Date(startStr + "T00:00:00");
  const end = new Date(endStr + "T00:00:00");
  const current = new Date(start);
  while (current.getTime() <= end.getTime()) {
    result.push(toLocalDateString(current));
    current.setDate(current.getDate() + 1);
  }
  return result;
}

type EnquiryRow = {
  id: string;
  created_at: string;
  status: string | null;
  enquiry_parts?: { part_name: string | null; price: number | null; cost_price: number | null }[];
};

export async function GET(request: NextRequest) {
  const { supabase, cookiesToSet } = await createServerClientForRoute(request);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json(
      { error: "Missing start or end query param (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const startDate = new Date(start + "T00:00:00");
  const endDate = new Date(end + "T23:59:59.999");
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return NextResponse.json(
      { error: "Invalid start or end date" },
      { status: 400 }
    );
  }

  const { data: rows, error } = await supabase
    .from("enquiries")
    .select("id, created_at, status, enquiry_parts(part_name, price, cost_price)")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const enquiries = (rows ?? []) as EnquiryRow[];
  const startString = toLocalDateString(startDate);
  const endString = toLocalDateString(endDate);
  const dateRange = generateDateRange(startString, endString);

  const confirmedOrClosed = enquiries.filter(
    (e) => e.status === "confirmed" || e.status === "closed"
  );

  const revenueByDate = new Map<string, { revenue: number; profit: number }>();
  for (const e of confirmedOrClosed) {
    const dateKey = toLocalDateString(new Date(e.created_at));
    const parts = e.enquiry_parts ?? [];
    let revenue = 0;
    let profit = 0;
    for (const p of parts) {
      const pr = p.price ?? 0;
      const cost = p.cost_price ?? 0;
      revenue += pr;
      profit += pr - cost;
    }
    const existing = revenueByDate.get(dateKey) ?? { revenue: 0, profit: 0 };
    revenueByDate.set(dateKey, {
      revenue: existing.revenue + revenue,
      profit: existing.profit + profit,
    });
  }

  const revenueOverTime = dateRange.map((date) => {
    const v = revenueByDate.get(date) ?? { revenue: 0, profit: 0 };
    return { date, revenue: v.revenue, profit: v.profit };
  });

  const enquiriesByDate = new Map<string, number>();
  for (const e of enquiries) {
    const dateKey = toLocalDateString(new Date(e.created_at));
    enquiriesByDate.set(dateKey, (enquiriesByDate.get(dateKey) ?? 0) + 1);
  }
  const enquiriesOverTime = dateRange.map((date) => ({
    date,
    enquiries: enquiriesByDate.get(date) ?? 0,
  }));

  const statusFunnel: Record<string, number> = {};
  for (const k of STATUS_KEYS) {
    statusFunnel[k] = 0;
  }
  for (const e of enquiries) {
    const s = e.status ?? "new";
    if (STATUS_KEYS.includes(s as (typeof STATUS_KEYS)[number])) {
      statusFunnel[s]++;
    } else {
      statusFunnel.new++;
    }
  }

  const partProfit = new Map<string, number>();
  for (const e of confirmedOrClosed) {
    const parts = e.enquiry_parts ?? [];
    for (const p of parts) {
      const name = (p.part_name?.trim() || "—") as string;
      const profit = (p.price ?? 0) - (p.cost_price ?? 0);
      partProfit.set(name, (partProfit.get(name) ?? 0) + profit);
    }
  }
  const topProfitableParts = Array.from(partProfit.entries())
    .map(([part_name, profit]) => ({ part_name, profit }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  const body = {
    revenueOverTime,
    enquiriesOverTime,
    statusFunnel,
    topProfitableParts,
  };

  const res = NextResponse.json(body, { status: 200 });
  cookiesToSet.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, (options ?? {}) as { path?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: "lax" | "strict" | "none" });
  });
  return res;
}
