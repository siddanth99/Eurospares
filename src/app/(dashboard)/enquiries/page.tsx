"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabase/client";
import PageContainer from "@/src/components/layout/PageContainer";
import PageHeader from "@/src/components/layout/PageHeader";
import { AdminTable, type AdminTableColumn } from "@/src/components/admin-table/AdminTable";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";

type Enquiry = {
  id: string;
  car_model: string | null;
  part_name: string | null;
  customer: string | null;
  customer_name?: string | null;
  status: string | null;
  price: number | null;
  cost_price: number | null;
  created_at: string;
};

type EnquiryRow = Enquiry & { margin: number; marginPct: number | null };

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "waiting_price", label: "Waiting price" },
  { value: "price_received", label: "Price received" },
  { value: "customer_informed", label: "Customer informed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "closed", label: "Closed" },
] as const;

function statusLabel(value: string | null): string {
  if (!value) return "—";
  return STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    car_model: "",
    part_name: "",
    customer_name: "",
    customer_phone: "",
    notes: "",
  });
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState("");
  const [editingCostPriceId, setEditingCostPriceId] = useState<string | null>(null);
  const [editingCostPriceValue, setEditingCostPriceValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredEnquiries = useMemo(() => {
    let list = enquiries;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          (e.car_model?.toLowerCase().includes(q) ?? false) ||
          (e.part_name?.toLowerCase().includes(q) ?? false)
      );
    }
    if (statusFilter) {
      list = list.filter((e) => e.status === statusFilter);
    }
    return list;
  }, [enquiries, searchQuery, statusFilter]);

  async function fetchEnquiries() {
    const { data, error } = await supabase
      .from("enquiries")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setEnquiries(data ?? []);
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      await fetchEnquiries();
      setLoading(false);
    }
    init();
  }, []);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatPrice(value: number | null) {
    if (value == null) return "—";
    return "₹" + value.toLocaleString("en-IN");
  }

  function getMargin(row: Enquiry) {
    const price = row.price ?? 0;
    const cost = row.cost_price ?? 0;
    return price - cost;
  }

  function getMarginPercentage(row: Enquiry): number | null {
    const price = row.price;
    if (price == null || price === 0) return null;
    const margin = getMargin(row);
    return (margin / price) * 100;
  }

  function openModal() {
    setModalOpen(true);
    setFormError(null);
    setForm({
      car_model: "",
      part_name: "",
      customer_name: "",
      customer_phone: "",
      notes: "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFormError("Not signed in.");
        return;
      }
      const { error: insertError } = await supabase.from("enquiries").insert({
        car_model: form.car_model.trim() || null,
        part_name: form.part_name.trim() || null,
        customer_name: form.customer_name.trim() || null,
        customer_phone: form.customer_phone.trim() || null,
        notes: form.notes.trim() || null,
        status: "new",
      });
      if (insertError) {
        setFormError(insertError.message);
        return;
      }
      setModalOpen(false);
      await fetchEnquiries();
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    setEditingStatusId(null);
    setEnquiries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
    );
    await supabase.from("enquiries").update({ status: newStatus }).eq("id", id);
  }

  function startEditingPrice(row: Enquiry) {
    setEditingPriceId(row.id);
    setEditingPriceValue(row.price != null ? String(row.price) : "");
  }

  async function submitPriceEdit(id: string) {
    const raw = editingPriceValue.trim();
    const num = raw === "" ? null : parseFloat(raw.replace(/,/g, ""));
    const value = num != null && !Number.isNaN(num) ? num : null;
    setEditingPriceId(null);
    setEditingPriceValue("");
    setEnquiries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, price: value } : e))
    );
    await supabase.from("enquiries").update({ price: value }).eq("id", id);
  }

  function startEditingCostPrice(row: Enquiry) {
    setEditingCostPriceId(row.id);
    setEditingCostPriceValue(row.cost_price != null ? String(row.cost_price) : "");
  }

  async function submitCostPriceEdit(id: string) {
    const raw = editingCostPriceValue.trim();
    const num = raw === "" ? null : parseFloat(raw.replace(/,/g, ""));
    const value = num != null && !Number.isNaN(num) ? num : null;
    setEditingCostPriceId(null);
    setEditingCostPriceValue("");
    setEnquiries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, cost_price: value } : e))
    );
    await supabase.from("enquiries").update({ cost_price: value }).eq("id", id);
  }

  const tableData: EnquiryRow[] = useMemo(
    () =>
      filteredEnquiries.map((e) => ({
        ...e,
        margin: getMargin(e),
        marginPct: getMarginPercentage(e),
      })),
    [filteredEnquiries]
  );

  function statusBadgeVariant(status: string | null): "default" | "secondary" | "outline" {
    if (status === "waiting_price") return "secondary";
    if (status === "confirmed") return "default";
    return "outline";
  }

  const columns: AdminTableColumn<EnquiryRow>[] = useMemo(
    () => [
      { header: "Car Model", accessor: "car_model", cell: (row) => row.car_model ?? "—" },
      { header: "Part Name", accessor: "part_name", cell: (row) => row.part_name ?? "—" },
      {
        header: "Customer",
        accessor: "customer",
        cell: (row) => row.customer_name ?? row.customer ?? "—",
      },
      {
        header: "Status",
        accessor: "status",
        cell: (row) =>
          editingStatusId === row.id ? (
            <select
              value={row.status ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v) handleStatusChange(row.id, v);
              }}
              onBlur={() => setEditingStatusId(null)}
              autoFocus
              className="text-xs rounded border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring py-1.5 px-2 min-w-[120px]"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <button
              type="button"
              onClick={() => setEditingStatusId(row.id)}
              className="text-left"
            >
              <Badge variant={statusBadgeVariant(row.status)}>
                {statusLabel(row.status)}
              </Badge>
            </button>
          ),
      },
      {
        header: "Price",
        accessor: "price",
        align: "right",
        cell: (row) =>
          editingPriceId === row.id ? (
            <input
              type="text"
              inputMode="decimal"
              value={editingPriceValue}
              onChange={(e) => setEditingPriceValue(e.target.value)}
              onBlur={() => submitPriceEdit(row.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              autoFocus
              className="w-24 text-xs rounded border border-input bg-background text-foreground px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          ) : (
            <button
              type="button"
              onClick={() => startEditingPrice(row)}
              className="text-sm text-foreground hover:text-muted-foreground text-right w-full"
            >
              {formatPrice(row.price)}
            </button>
          ),
      },
      {
        header: "Cost Price",
        accessor: "cost_price",
        align: "right",
        cell: (row) =>
          editingCostPriceId === row.id ? (
            <input
              type="text"
              inputMode="decimal"
              value={editingCostPriceValue}
              onChange={(e) => setEditingCostPriceValue(e.target.value)}
              onBlur={() => submitCostPriceEdit(row.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              autoFocus
              className="w-24 text-xs rounded border border-input bg-background text-foreground px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          ) : (
            <button
              type="button"
              onClick={() => startEditingCostPrice(row)}
              className="text-sm text-foreground hover:text-muted-foreground text-right w-full"
            >
              {formatPrice(row.cost_price)}
            </button>
          ),
      },
      {
        header: "Margin",
        accessor: "margin",
        align: "right",
        cell: (row) => formatPrice(row.margin),
      },
      {
        header: "Margin %",
        accessor: "marginPct",
        align: "right",
        cell: (row) => {
          const pct = row.marginPct;
          return pct != null ? `${pct.toFixed(1)}%` : "—";
        },
      },
      {
        header: "Created At",
        accessor: "created_at",
        cell: (row) => formatDate(row.created_at),
      },
      {
        header: "Actions",
        accessor: "id",
        align: "right",
        cell: () => (
          <Button variant="ghost" size="sm" type="button">
            —
          </Button>
        ),
      },
    ],
    [
      editingStatusId,
      editingPriceId,
      editingPriceValue,
      editingCostPriceId,
      editingCostPriceValue,
    ]
  );

  return (
    <PageContainer>
      <PageHeader
        title="Enquiries"
        description="Manage customer enquiries and pricing."
        actions={
          <Button onClick={openModal} type="button">
            + New Enquiry
          </Button>
        }
      />

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => !submitLoading && setModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">
              New Enquiry
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="car_model"
                  className="block text-xs font-medium text-foreground mb-1.5"
                >
                  Car Model <span className="text-destructive">*</span>
                </label>
                <input
                  id="car_model"
                  type="text"
                  value={form.car_model}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, car_model: e.target.value }))
                  }
                  required
                  className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. BMW 3 Series"
                />
              </div>
              <div>
                <label
                  htmlFor="part_name"
                  className="block text-xs font-medium text-foreground mb-1.5"
                >
                  Part Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="part_name"
                  type="text"
                  value={form.part_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, part_name: e.target.value }))
                  }
                  required
                  className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. Brake pads"
                />
              </div>
              <div>
                <label
                  htmlFor="customer_name"
                  className="block text-xs font-medium text-foreground mb-1.5"
                >
                  Customer Name
                </label>
                <input
                  id="customer_name"
                  type="text"
                  value={form.customer_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customer_name: e.target.value }))
                  }
                  className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label
                  htmlFor="customer_phone"
                  className="block text-xs font-medium text-foreground mb-1.5"
                >
                  Customer Phone
                </label>
                <input
                  id="customer_phone"
                  type="tel"
                  value={form.customer_phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customer_phone: e.target.value }))
                  }
                  className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="+44 7700 900000"
                />
              </div>
              <div>
                <label
                  htmlFor="notes"
                  className="block text-xs font-medium text-foreground mb-1.5"
                >
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Optional notes"
                />
              </div>
              {formError && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => !submitLoading && setModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitLoading} className="flex-1">
                  {submitLoading ? "Saving…" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Card padding="md" className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search car model, part name…"
            className="h-9 w-full min-w-[200px] max-w-xs text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground px-3 focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 text-sm rounded-lg border border-input bg-background text-foreground px-3 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      ) : enquiries.length === 0 ? (
        <AdminTable columns={columns} data={[]} />
      ) : filteredEnquiries.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No enquiries match your filters.
          </p>
        </div>
      ) : (
        <AdminTable columns={columns} data={tableData} />
      )}
    </PageContainer>
  );
}
