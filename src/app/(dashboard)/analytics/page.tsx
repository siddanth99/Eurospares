import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import PageContainer from "@/src/components/layout/PageContainer";
import PageHeader from "@/src/components/layout/PageHeader";
import EnquiriesChart from "@/src/components/analytics/EnquiriesChart";
import AnalyticsDateRange from "@/src/components/analytics/AnalyticsDateRange";

type Row = { id: string; created_at: string };

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function generateDateRange(start: Date, end: Date): string[] {
  const result: string[] = [];
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const current = new Date(s);
  while (current.getTime() <= e.getTime()) {
    result.push(toLocalDateString(current));
    current.setDate(current.getDate() + 1);
  }
  return result;
}

function parseRange(
  params: { range?: string; start?: string; end?: string }
): { start: Date; end: Date; range: "7" | "30" | "custom"; startStr?: string; endStr?: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (params.start && params.end) {
    let start = new Date(params.start);
    let end = new Date(params.end);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      if (start.getTime() > end.getTime()) {
        [start, end] = [end, start];
      }
      return {
        start,
        end,
        range: "custom",
        startStr: toLocalDateString(start),
        endStr: toLocalDateString(end),
      };
    }
  }

  if (params.range === "30") {
    const start = new Date(today);
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    return { start, end, range: "30" };
  }

  const start = new Date(today);
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  return { start, end, range: "7" };
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const { start: rangeStart, end: rangeEnd, range, startStr, endStr } = parseRange(params);

  const { data } = await supabase
    .from("enquiries")
    .select("id, created_at")
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as Row[];
  const startString = toLocalDateString(rangeStart);
  const endString = toLocalDateString(rangeEnd);
  const filtered = rows.filter((row) => {
    const rowDateStr = toLocalDateString(new Date(row.created_at));
    return rowDateStr >= startString && rowDateStr <= endString;
  });

  const countByDate = new Map<string, number>();
  for (const row of filtered) {
    const key = toLocalDateString(new Date(row.created_at));
    countByDate.set(key, (countByDate.get(key) ?? 0) + 1);
  }
  const dateRange = generateDateRange(rangeStart, rangeEnd);
  const chartData = dateRange.map((date) => ({
    date,
    count: countByDate.get(date) ?? 0,
  }));

  return (
    <PageContainer>
      <PageHeader
        title="Analytics"
        description="Enquiries over time."
        actions={
          <AnalyticsDateRange
            currentRange={range}
            start={startStr}
            end={endStr}
          />
        }
      />
      <EnquiriesChart data={chartData} />
    </PageContainer>
  );
}
