"use client";

import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type RevenueOverTimeItem = { date: string; revenue: number; profit: number };
export type EnquiriesOverTimeItem = { date: string; enquiries: number };
export type StatusFunnel = Record<string, number>;
export type TopPartItem = { part_name: string; profit: number };

type Props = {
  revenueOverTime: RevenueOverTimeItem[];
  enquiriesOverTime: EnquiriesOverTimeItem[];
  statusFunnel: StatusFunnel;
  topProfitableParts: TopPartItem[];
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  waiting_price: "Waiting price",
  price_received: "Price received",
  customer_informed: "Customer informed",
  confirmed: "Confirmed",
  closed: "Closed",
};

function formatCurrency(value: number): string {
  return "₹" + value.toLocaleString("en-IN");
}

export default function AnalyticsOverviewCharts({
  revenueOverTime,
  enquiriesOverTime,
  statusFunnel,
  topProfitableParts,
}: Props) {
  const funnelData = Object.entries(statusFunnel).map(([status, count]) => ({
    name: STATUS_LABELS[status] ?? status,
    count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-700 mb-4">
            Enquiries over time
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={enquiriesOverTime}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="enquiries" name="Enquiries" fill="rgb(79, 70, 229)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-700 mb-4">
            Revenue over time
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueOverTime}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
                <Tooltip formatter={(v: number | undefined) => formatCurrency(v ?? 0)} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="rgb(79, 70, 229)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-700 mb-4">
            Profit over time
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueOverTime}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
                <Tooltip formatter={(v: number | undefined) => formatCurrency(v ?? 0)} />
                <Bar dataKey="profit" name="Profit" fill="rgb(34, 197, 94)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-700 mb-4">
            Status funnel
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnelData}
                layout="vertical"
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Enquiries" fill="rgb(99, 102, 241)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-700 mb-4">
            Top profitable parts
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProfitableParts}
                layout="vertical"
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v)} />
                <YAxis type="category" dataKey="part_name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number | undefined) => formatCurrency(v ?? 0)} />
                <Bar dataKey="profit" name="Profit" fill="rgb(34, 197, 94)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
