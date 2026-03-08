import { headers } from "next/headers";
import { redirect } from "next/navigation";
import PageContainer from "@/src/components/layout/PageContainer";
import PageHeader from "@/src/components/layout/PageHeader";
import AnalyticsDateRange from "@/src/components/analytics/AnalyticsDateRange";
import AnalyticsOverviewCharts from "@/src/components/analytics/AnalyticsOverviewCharts";

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
    return { start, end, range: "30", startStr: toLocalDateString(start), endStr: toLocalDateString(end) };
  }

  const start = new Date(today);
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  return { start, end, range: "7", startStr: toLocalDateString(start), endStr: toLocalDateString(end) };
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const { range, startStr, endStr } = parseRange(params);

  if (!startStr || !endStr) {
    redirect("/analytics");
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const base = `${protocol}://${host}`;
  const cookie = headersList.get("cookie");
  const res = await fetch(
    `${base}/api/analytics/overview?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}`,
    {
      cache: "no-store",
      headers: cookie ? { cookie } : undefined,
    }
  );

  if (!res.ok) {
    if (res.status === 401) redirect("/login");
    return (
      <PageContainer>
        <PageHeader
          title="Analytics"
          description="Overview and key metrics."
          actions={
            <AnalyticsDateRange currentRange={range} start={startStr} end={endStr} />
          }
        />
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          Failed to load analytics. Try another date range.
        </div>
      </PageContainer>
    );
  }

  const data = (await res.json()) as {
    revenueOverTime: { date: string; revenue: number; profit: number }[];
    enquiriesOverTime: { date: string; enquiries: number }[];
    statusFunnel: Record<string, number>;
    topProfitableParts: { part_name: string; profit: number }[];
  };

  return (
    <PageContainer>
      <PageHeader
        title="Analytics"
        description="Overview and key metrics."
        actions={
          <AnalyticsDateRange currentRange={range} start={startStr} end={endStr} />
        }
      />
      <AnalyticsOverviewCharts
        revenueOverTime={data.revenueOverTime ?? []}
        enquiriesOverTime={data.enquiriesOverTime ?? []}
        statusFunnel={data.statusFunnel ?? {}}
        topProfitableParts={data.topProfitableParts ?? []}
      />
    </PageContainer>
  );
}
