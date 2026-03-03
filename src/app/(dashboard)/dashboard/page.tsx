import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import PageContainer from "@/src/components/layout/PageContainer";
import PageHeader from "@/src/components/layout/PageHeader";
import { AdminTable, type AdminTableColumn } from "@/src/components/admin-table/AdminTable";
import { Card } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import type { EnquiryWithParts } from "@/src/lib/types/enquiry";

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  waiting_price: "Waiting price",
  price_received: "Price received",
  customer_informed: "Customer informed",
  confirmed: "Confirmed",
  closed: "Closed",
};

function statusLabel(value: string | null): string {
  if (!value) return "—";
  return STATUS_LABELS[value] ?? value;
}

function statusBadgeVariant(
  status: string | null
): "default" | "secondary" | "outline" {
  if (status === "waiting_price") return "secondary";
  if (status === "confirmed" || status === "closed") return "default";
  return "outline";
}

function formatCurrency(value: number): string {
  return "₹" + value.toLocaleString("en-IN");
}

function enquiryTotalRevenue(e: EnquiryWithParts): number {
  return (e.parts ?? []).reduce((sum, p) => sum + (p.price ?? 0), 0);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("enquiries")
    .select("*, enquiry_parts(*)")
    .order("created_at", { ascending: false });

  const raw = (data ?? []) as (Record<string, unknown> & { enquiry_parts?: unknown[] })[];
  const enquiries: EnquiryWithParts[] = raw.map((row) => {
    const { enquiry_parts, ...rest } = row;
    return { ...rest, parts: enquiry_parts ?? [] } as EnquiryWithParts;
  });

  const totalEnquiries = enquiries.length;
  const confirmedOrClosed = enquiries.filter((e) =>
    e.status === "confirmed" || e.status === "closed"
  );
  const totalConfirmed = enquiries.filter((e) => e.status === "confirmed").length;
  const totalRevenue = confirmedOrClosed.reduce(
    (sum, e) => sum + enquiryTotalRevenue(e),
    0
  );
  const totalCost = confirmedOrClosed.reduce(
    (sum, e) =>
      sum +
      (e.parts ?? []).reduce((s, p) => s + (p.cost_price ?? 0), 0),
    0
  );
  const totalProfit = totalRevenue - totalCost;
  const conversionRate =
    totalEnquiries > 0
      ? Math.round((totalConfirmed / totalEnquiries) * 100)
      : 0;
  const marginPct =
    totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const carCounts = new Map<string, number>();
  for (const e of enquiries) {
    const key = e.car_model?.trim() || "—";
    carCounts.set(key, (carCounts.get(key) ?? 0) + 1);
  }
  const topCars = Array.from(carCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const partCounts = new Map<string, number>();
  for (const e of confirmedOrClosed) {
    for (const p of e.parts ?? []) {
      const key = p.part_name?.trim() || "—";
      partCounts.set(key, (partCounts.get(key) ?? 0) + 1);
    }
  }
  const topParts = Array.from(partCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recentEnquiries = enquiries.slice(0, 5);
  type RecentRow = EnquiryWithParts & { totalRevenue: number };
  const recentRows: RecentRow[] = recentEnquiries.map((e) => ({
    ...e,
    totalRevenue: enquiryTotalRevenue(e),
  }));

  const recentColumns: AdminTableColumn<RecentRow>[] = [
    { header: "Car Model", accessor: "car_model", cell: (r) => r.car_model ?? "—" },
    {
      header: "Customer",
      accessor: "customer_name",
      cell: (r) => r.customer_name ?? r.customer ?? "—",
    },
    {
      header: "Status",
      accessor: "status",
      cell: (r) => (
        <Badge variant={statusBadgeVariant(r.status)}>
          {statusLabel(r.status)}
        </Badge>
      ),
    },
    {
      header: "Revenue",
      accessor: "totalRevenue",
      align: "right",
      cell: (r) =>
        r.totalRevenue > 0 ? formatCurrency(r.totalRevenue) : "—",
    },
    {
      header: "Created",
      accessor: "created_at",
      cell: (r) =>
        new Date(r.created_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Business intelligence and key metrics."
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card padding="md" className="rounded-xl shadow-sm">
          <p className="text-2xl font-semibold text-foreground">
            {totalEnquiries}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Total enquiries
          </p>
        </Card>
        <Card padding="md" className="rounded-xl shadow-sm">
          <p className="text-2xl font-semibold text-foreground">
            {totalConfirmed}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Confirmed
          </p>
        </Card>
        <Card padding="md" className="rounded-xl shadow-sm">
          <p className="text-2xl font-semibold text-foreground">
            {conversionRate}%
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Conversion rate
          </p>
        </Card>
        <Card padding="md" className="rounded-xl shadow-sm">
          <p className="text-2xl font-semibold text-foreground">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Revenue
          </p>
        </Card>
        <Card padding="md" className="rounded-xl shadow-sm">
          <p className="text-2xl font-semibold text-foreground">
            {formatCurrency(totalProfit)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Profit
          </p>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md" className="rounded-xl shadow-sm">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4">
            Top cars
          </h2>
          <ul className="space-y-2">
            {topCars.length === 0 ? (
              <li className="text-sm text-muted-foreground">No data</li>
            ) : (
              topCars.map(({ name, count }) => (
                <li
                  key={name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground">{name}</span>
                  <Badge variant="secondary">{count}</Badge>
                </li>
              ))
            )}
          </ul>
        </Card>
        <Card padding="md" className="rounded-xl shadow-sm">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4">
            Top parts (confirmed / closed)
          </h2>
          <ul className="space-y-2">
            {topParts.length === 0 ? (
              <li className="text-sm text-muted-foreground">No data</li>
            ) : (
              topParts.map(({ name, count }) => (
                <li
                  key={name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground">{name}</span>
                  <Badge variant="secondary">{count}</Badge>
                </li>
              ))
            )}
          </ul>
        </Card>
      </section>

      <section>
        <Card padding="md" className="rounded-xl shadow-sm">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4">
            Revenue breakdown
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Revenue
              </p>
              <p className="text-lg font-semibold text-foreground mt-1">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Cost
              </p>
              <p className="text-lg font-semibold text-foreground mt-1">
                {formatCurrency(totalCost)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Profit
              </p>
              <p className="text-lg font-semibold text-foreground mt-1">
                {formatCurrency(totalProfit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Margin %
              </p>
              <p className="text-lg font-semibold text-foreground mt-1">
                {totalRevenue > 0
                  ? `${marginPct.toFixed(1)}%`
                  : "—"}
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4">
          Recent enquiries
        </h2>
        <AdminTable columns={recentColumns} data={recentRows} />
      </section>
    </PageContainer>
  );
}
