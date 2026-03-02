import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import PageContainer from "@/src/components/layout/PageContainer";
import PageHeader from "@/src/components/layout/PageHeader";
import { AdminTable, type AdminTableColumn } from "@/src/components/admin-table/AdminTable";
import { Card } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";

type Enquiry = {
  id: string;
  car_model: string | null;
  part_name: string | null;
  customer: string | null;
  customer_name?: string | null;
  status: string | null;
  price: number | null;
  cost_price: number | null;
  assigned_to: string | null;
  created_at: string;
};

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
  if (status === "confirmed") return "default";
  return "outline";
}

function formatCurrency(value: number): string {
  return "₹" + value.toLocaleString("en-IN");
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
  .select("*")
  .order("created_at", { ascending: false });

const enquiries = (data ?? []) as Enquiry[];

  const totalEnquiries = enquiries.length;
  const confirmedEnquiries = enquiries.filter(
    (e) => e.status === "confirmed"
  );
  const totalConfirmed = confirmedEnquiries.length;

  const totalRevenue = confirmedEnquiries.reduce(
    (sum, e) => sum + (e.price ?? 0),
    0
  );
  const totalCost = confirmedEnquiries.reduce(
    (sum, e) => sum + (e.cost_price ?? 0),
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
  for (const e of confirmedEnquiries) {
    const key = e.part_name?.trim() || "—";
    partCounts.set(key, (partCounts.get(key) ?? 0) + 1);
  }
  const topParts = Array.from(partCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recentEnquiries = enquiries.slice(0, 5);

  const recentColumns: AdminTableColumn<Enquiry>[] = [
    { header: "Car Model", accessor: "car_model", cell: (r) => r.car_model ?? "—" },
    { header: "Part Name", accessor: "part_name", cell: (r) => r.part_name ?? "—" },
    {
      header: "Customer",
      accessor: "customer",
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
      header: "Price",
      accessor: "price",
      align: "right",
      cell: (r) =>
        r.price != null ? formatCurrency(r.price) : "—",
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
        description="Business intelligence and key metrics for your shop."
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
            Top parts (confirmed)
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
        <AdminTable columns={recentColumns} data={recentEnquiries} />
      </section>
    </PageContainer>
  );
}
