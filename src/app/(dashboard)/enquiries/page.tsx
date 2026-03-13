"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { EnquiryPart, EnquiryWithParts } from "@/src/lib/types/enquiry";
import PageContainer from "@/src/components/layout/PageContainer";
import PageHeader from "@/src/components/layout/PageHeader";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import QuickEnquiryModal from "@/src/components/enquiries/QuickEnquiryModal";

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

type FormPart = {
  id?: string;
  part_name: string;
  price: string;
  cost_price: string;
  supplier_available_date: string;
  oe_number: string;
};

function createEmptyForm() {
  return {
    car_model: "",
    customer_name: "",
    customer_phone: "",
    chassis_number: "",
    notes: "",
    requested_date: "",
    parts: [
      {
        part_name: "",
        oe_number: "",
        price: "",
        cost_price: "",
        supplier_available_date: "",
      },
    ] as FormPart[],
  };
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<EnquiryWithParts[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState(createEmptyForm());
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingPricePartId, setEditingPricePartId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState("");
  const [editingCostPricePartId, setEditingCostPricePartId] = useState<string | null>(null);
  const [editingCostPriceValue, setEditingCostPriceValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingEnquiry, setEditingEnquiry] = useState<EnquiryWithParts | null>(null);
  const [quickEnquiryModalOpen, setQuickEnquiryModalOpen] = useState(false);
  const [oeHistorySuggestions, setOeHistorySuggestions] = useState<Record<number, string[]>>({});
  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const menuPortalRef = useRef<HTMLDivElement | null>(null);

  const filteredEnquiries = useMemo(() => {
    let list = enquiries;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          (e.car_model?.toLowerCase().includes(q) ?? false) ||
          (e.parts?.some((p) => p.part_name?.toLowerCase().includes(q)) ?? false)
      );
    }
    if (statusFilter) {
      list = list.filter((e) => e.status === statusFilter);
    }
    return list;
  }, [enquiries, searchQuery, statusFilter]);

  async function fetchEnquiries() {
    const res = await fetch("/api/enquiries", { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    setEnquiries(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    async function init() {
      await fetchEnquiries();
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (openMenuId === null) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        (menuContainerRef.current?.contains(target)) ||
        (menuPortalRef.current?.contains(target))
      ) {
        return;
      }
      setOpenMenuId(null);
      setMenuPosition(null);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [openMenuId]);

  useEffect(() => {
    if (!openMenuId) return;
    const close = () => {
      setOpenMenuId(null);
      setMenuPosition(null);
    };
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [openMenuId]);

  useEffect(() => {
    if (deleteConfirmId === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDeleteConfirmId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteConfirmId]);

  useEffect(() => {
    if (!modalOpen || !editingEnquiry) return;
    setFormError(null);
    setForm({
      car_model: editingEnquiry.car_model ?? "",
      customer_name: editingEnquiry.customer_name ?? editingEnquiry.customer ?? "",
      customer_phone: editingEnquiry.customer_phone ?? "",
      chassis_number: "",
      notes: editingEnquiry.notes ?? "",
      requested_date: editingEnquiry.requested_date
        ? String(editingEnquiry.requested_date).slice(0, 10)
        : "",
      parts:
        (editingEnquiry.parts ?? []).length > 0
          ? (editingEnquiry.parts ?? []).map((p) => ({
              id: p.id,
              part_name: p.part_name ?? "",
              price: p.price != null ? String(p.price) : "",
              cost_price: p.cost_price != null ? String(p.cost_price) : "",
              supplier_available_date: p.supplier_available_date
                ? String(p.supplier_available_date).slice(0, 10)
                : "",
              oe_number: p.oe_number ?? "",
            }))
          : [{ part_name: "", price: "", cost_price: "", supplier_available_date: "", oe_number: "" }],
    });
  }, [modalOpen, editingEnquiry?.id]);

  async function handleDeleteEnquiry(id: string) {
    const res = await fetch(`/api/enquiries/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) setEnquiries((prev) => prev.filter((e) => e.id !== id));
    setDeleteConfirmId(null);
  }

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

  function getPartMargin(p: EnquiryPart) {
    const price = p.price ?? 0;
    const cost = p.cost_price ?? 0;
    return price - cost;
  }

  function getPartMarginPct(p: EnquiryPart): number | null {
    const price = p.price;
    if (price == null || price === 0) return null;
    return (getPartMargin(p) / price) * 100;
  }

  function openModal() {
    setEditingEnquiry(null);
    setFormError(null);
    setForm(createEmptyForm());
    setModalOpen(true);
  }

  function addPart() {
    setForm((f) => ({
      ...f,
      parts: [
        ...f.parts,
        { part_name: "", price: "", cost_price: "", supplier_available_date: "", oe_number: "" },
      ],
    }));
  }

  function removePart(index: number) {
    if (form.parts.length <= 1) return;
    setForm((f) => ({
      ...f,
      parts: f.parts.filter((_, i) => i !== index),
    }));
  }

  function updatePart(index: number, field: keyof FormPart, value: string) {
    setForm((f) => ({
      ...f,
      parts: f.parts.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));
  }

  async function fetchHistoricalSuggestions(index: number, partName: string) {
    if (!partName.trim()) return;
    const res = await fetch("/api/parts/history-suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ part_name: partName.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setOeHistorySuggestions((prev) => ({
      ...prev,
      [index]: Array.isArray(data.suggestions) ? data.suggestions : [],
    }));
  }

  function parsePartNums(p: FormPart) {
    return {
      part_name: p.part_name.trim() || null,
      price: p.price.trim() ? parseFloat(p.price.replace(/,/g, "")) : null,
      cost_price: p.cost_price.trim() ? parseFloat(p.cost_price.replace(/,/g, "")) : null,
      supplier_available_date: p.supplier_available_date.trim() || null,
      oe_number: p.oe_number.trim() || null,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitLoading(true);
    try {
      const partsWithName = form.parts.filter((p) => p.part_name.trim());
      if (partsWithName.length === 0) {
        setFormError("Add at least one part.");
        return;
      }

      if (!editingEnquiry) {
        const partsPayload = partsWithName.map((p) => parsePartNums(p));
        const res = await fetch("/api/enquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            car_model: form.car_model.trim() || null,
            customer_name: form.customer_name.trim() || null,
            customer_phone: form.customer_phone.trim() || null,
            notes: form.notes.trim() || null,
            requested_date: form.requested_date.trim() || null,
            parts: partsPayload,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setFormError(data.error ?? "Failed to create enquiry.");
          return;
        }
        setModalOpen(false);
        setEditingEnquiry(null);
        await fetchEnquiries();
        return;
      }

      const enquiryId = editingEnquiry.id;
      const patchRes = await fetch(`/api/enquiries/${enquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          car_model: form.car_model.trim() || null,
          customer_name: form.customer_name.trim() || null,
          customer_phone: form.customer_phone.trim() || null,
          notes: form.notes.trim() || null,
          requested_date: form.requested_date.trim() || null,
          status: editingEnquiry.status,
        }),
      });
      if (!patchRes.ok) {
        const data = await patchRes.json().catch(() => ({}));
        setFormError(data.error ?? "Failed to update enquiry.");
        return;
      }

      const originalParts = editingEnquiry.parts ?? [];
      const currentParts = form.parts.filter((p) => p.part_name.trim());
      const currentIds = new Set(currentParts.map((p) => p.id).filter(Boolean) as string[]);

      for (const p of currentParts) {
        const payload = parsePartNums(p);
        if (p.id) {
          const r = await fetch(`/api/enquiries/${enquiryId}/parts/${p.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });
          if (!r.ok) {
            const data = await r.json().catch(() => ({}));
            setFormError(data.error ?? "Failed to update part.");
            return;
          }
        } else {
          const r = await fetch(`/api/enquiries/${enquiryId}/parts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });
          if (!r.ok) {
            const data = await r.json().catch(() => ({}));
            setFormError(data.error ?? "Failed to add part.");
            return;
          }
        }
      }

      for (const p of originalParts) {
        if (!currentIds.has(p.id)) {
          const r = await fetch(`/api/enquiries/${enquiryId}/parts/${p.id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (!r.ok) {
            const data = await r.json().catch(() => ({}));
            setFormError(data.error ?? "Failed to remove part.");
            return;
          }
        }
      }

      setModalOpen(false);
      setEditingEnquiry(null);
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
    await fetch(`/api/enquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: newStatus }),
    });
  }

  function startEditingPartPrice(part: EnquiryPart) {
    setEditingPricePartId(part.id);
    setEditingPriceValue(part.price != null ? String(part.price) : "");
  }

  async function submitPartPriceEdit(enquiryId: string, partId: string) {
    const raw = editingPriceValue.trim();
    const num = raw === "" ? null : parseFloat(raw.replace(/,/g, ""));
    const value = num != null && !Number.isNaN(num) ? num : null;
    setEditingPricePartId(null);
    setEditingPriceValue("");
    setEnquiries((prev) =>
      prev.map((e) =>
        e.id === enquiryId
          ? {
              ...e,
              parts: (e.parts ?? []).map((p) =>
                p.id === partId ? { ...p, price: value } : p
              ),
            }
          : e
      )
    );
    await fetch(`/api/enquiries/${enquiryId}/parts/${partId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ price: value }),
    });
  }

  function startEditingPartCostPrice(part: EnquiryPart) {
    setEditingCostPricePartId(part.id);
    setEditingCostPriceValue(part.cost_price != null ? String(part.cost_price) : "");
  }

  async function submitPartCostPriceEdit(enquiryId: string, partId: string) {
    const raw = editingCostPriceValue.trim();
    const num = raw === "" ? null : parseFloat(raw.replace(/,/g, ""));
    const value = num != null && !Number.isNaN(num) ? num : null;
    setEditingCostPricePartId(null);
    setEditingCostPriceValue("");
    setEnquiries((prev) =>
      prev.map((e) =>
        e.id === enquiryId
          ? {
              ...e,
              parts: (e.parts ?? []).map((p) =>
                p.id === partId ? { ...p, cost_price: value } : p
              ),
            }
          : e
      )
    );
    await fetch(`/api/enquiries/${enquiryId}/parts/${partId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ cost_price: value }),
    });
  }

  function statusBadgeVariant(status: string | null): "default" | "secondary" | "outline" {
    if (status === "waiting_price") return "secondary";
    if (status === "confirmed") return "default";
    return "outline";
  }

  const totalPartsCount = (e: EnquiryWithParts) => (e.parts ?? []).length;

  return (
    <PageContainer>
      <PageHeader
        title="Enquiries"
        description="Manage customer enquiries and pricing."
        actions={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setQuickEnquiryModalOpen(true)}
            >
              + Quick Enquiry
            </Button>
            <Button onClick={openModal} type="button">
              + New Enquiry
            </Button>
          </div>
        }
      />

      <QuickEnquiryModal
        open={quickEnquiryModalOpen}
        onClose={() => setQuickEnquiryModalOpen(false)}
        onExtract={(data) => {
          console.log("PARENT_RECEIVED_EXTRACT", data);
          const mappedParts = data.parts?.length
            ? data.parts.map((p) => ({
                part_name: p.part_name ?? "",
                oe_number: p.oe_number ?? "",
                price: "",
                cost_price: "",
                supplier_available_date: "",
              }))
            : [
                {
                  part_name: "",
                  oe_number: "",
                  price: "",
                  cost_price: "",
                  supplier_available_date: "",
                },
              ];
          console.log("FORM_PARTS_AFTER_MAPPING", mappedParts);
          setForm({
            ...createEmptyForm(),
            car_model: data.car_model ?? "",
            customer_name: data.customer_name ?? "",
            customer_phone: data.customer_phone ?? "",
            chassis_number: data.chassis_number ?? "",
            parts: mappedParts,
          });
          setQuickEnquiryModalOpen(false);
          setEditingEnquiry(null);
          setFormError(null);
          setModalOpen(true);
        }}
      />

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => {
            if (!submitLoading) {
              setModalOpen(false);
              setEditingEnquiry(null);
            }
          }}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-border bg-card p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {editingEnquiry ? "Edit Enquiry" : "New Enquiry"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Car Model <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={form.car_model}
                  onChange={(e) => setForm((f) => ({ ...f, car_model: e.target.value }))}
                  required
                  className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background text-foreground"
                  placeholder="e.g. BMW 3 Series"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Requested date
                </label>
                <input
                  type="date"
                  value={form.requested_date}
                  onChange={(e) => setForm((f) => ({ ...f, requested_date: e.target.value }))}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Customer Name</label>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background text-foreground"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Customer Phone</label>
                <input
                  type="tel"
                  value={form.customer_phone}
                  onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background text-foreground"
                  placeholder="+44 7700 900000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Chassis Number</label>
                <input
                  type="text"
                  value={form.chassis_number}
                  onChange={(e) => setForm((f) => ({ ...f, chassis_number: e.target.value }))}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background text-foreground"
                  placeholder="SAJAC2652DNV57822"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground resize-none"
                  placeholder="Optional"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-foreground">Parts</label>
                  <Button type="button" variant="outline" size="sm" onClick={addPart}>
                    + Part
                  </Button>
                </div>
                <div className="space-y-3">
                  {form.parts.map((part, index) => (
                    <div key={index} className="p-3 rounded-lg border border-border space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Part {index + 1}</span>
                        {form.parts.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive h-8"
                            onClick={() => removePart(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={part.part_name}
                        onChange={(e) => updatePart(index, "part_name", e.target.value)}
                        placeholder="Part name"
                        className="w-full h-9 px-2 text-sm rounded border border-input bg-background text-foreground"
                      />
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">OE Number</label>
                        <input
                          type="text"
                          value={part.oe_number}
                          onChange={(e) => updatePart(index, "oe_number", e.target.value)}
                          onFocus={() => fetchHistoricalSuggestions(index, part.part_name)}
                          placeholder="OE number"
                          className="w-full h-9 px-2 text-sm rounded border border-input bg-background text-foreground"
                        />
                        {oeHistorySuggestions[index]?.length > 0 && (
                          <div className="text-xs text-muted-foreground space-y-1 mt-1">
                            <div>Suggestions from history:</div>
                            {oeHistorySuggestions[index].map((oe) => (
                              <button
                                key={oe}
                                type="button"
                                className="block text-blue-600 hover:underline"
                                onClick={() => updatePart(index, "oe_number", oe)}
                              >
                                {oe}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <input
                        type="date"
                        value={part.supplier_available_date}
                        onChange={(e) => updatePart(index, "supplier_available_date", e.target.value)}
                        placeholder="Supplier date"
                        className="w-full h-9 px-2 text-sm rounded border border-input bg-background text-foreground"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={part.price}
                          onChange={(e) => updatePart(index, "price", e.target.value)}
                          placeholder="Price"
                          className="h-9 px-2 text-sm rounded border border-input bg-background text-foreground"
                        />
                        <input
                          type="text"
                          inputMode="decimal"
                          value={part.cost_price}
                          onChange={(e) => updatePart(index, "cost_price", e.target.value)}
                          placeholder="Cost"
                          className="h-9 px-2 text-sm rounded border border-input bg-background text-foreground"
                        />
                      </div>
                    </div>
                  ))}
                </div>
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
                  onClick={() => {
                    if (!submitLoading) {
                      setModalOpen(false);
                      setEditingEnquiry(null);
                    }
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitLoading} className="flex-1">
                  {submitLoading
                    ? "Saving…"
                    : editingEnquiry
                      ? "Save Changes"
                      : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setDeleteConfirmId(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-modal-title" className="text-lg font-semibold text-slate-900 mb-2">
              Delete Enquiry
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete this enquiry? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => handleDeleteEnquiry(deleteConfirmId)}
              >
                Delete
              </Button>
            </div>
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
        <div className="overflow-x-auto rounded-lg border border-border">
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No records found.
          </div>
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">No enquiries match your filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="w-8 px-2 py-3 text-left"></th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground text-left">Car Model</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground text-left">Customer</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground text-left">Status</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground text-left">Parts</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground text-left">Requested</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground text-left">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.map((row) => (
                <React.Fragment key={row.id}>
                  <tr
                    key={row.id}
                    className="border-b border-border transition-colors hover:bg-muted/40"
                  >
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => setExpandedId((id) => (id === row.id ? null : row.id))}
                        className="p-1 rounded text-muted-foreground hover:bg-muted"
                        aria-expanded={expandedId === row.id}
                      >
                        <span
                          className={`inline-block transition-transform ${expandedId === row.id ? "rotate-90" : ""}`}
                        >
                          ▶
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-left">{row.car_model ?? "—"}</td>
                    <td className="px-4 py-3 text-left">{row.customer_name ?? row.customer ?? "—"}</td>
                    <td className="px-4 py-3 text-left">
                      {editingStatusId === row.id ? (
                        <select
                          value={row.status ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v) handleStatusChange(row.id, v);
                          }}
                          onBlur={() => setEditingStatusId(null)}
                          autoFocus
                          className="text-xs rounded border border-input bg-background py-1.5 px-2 min-w-[120px]"
                        >
                          {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      ) : (
                        <button type="button" onClick={() => setEditingStatusId(row.id)} className="text-left">
                          <Badge variant={statusBadgeVariant(row.status)}>{statusLabel(row.status)}</Badge>
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-left">{totalPartsCount(row)}</td>
                    <td className="px-4 py-3 text-left">
                      {row.requested_date
                        ? formatDate(row.requested_date)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-left">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div ref={openMenuId === row.id ? menuContainerRef : undefined}>
                        <button
                          type="button"
                          onClick={(e) => {
                            if (openMenuId === row.id) {
                              setOpenMenuId(null);
                              setMenuPosition(null);
                              return;
                            }
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPosition({
                              top: rect.bottom + window.scrollY,
                              left: rect.right - 128 + window.scrollX,
                            });
                            setOpenMenuId(row.id);
                          }}
                          className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
                          aria-label="Open actions menu"
                          aria-expanded={openMenuId === row.id}
                        >
                          <span className="text-lg leading-none">⋯</span>
                        </button>
                        {openMenuId === row.id && menuPosition &&
                          createPortal(
                            <div
                              ref={menuPortalRef}
                              className="fixed z-[1000] w-32 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                              style={{ top: menuPosition.top, left: menuPosition.left }}
                              role="menu"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                onClick={() => {
                                  setEditingEnquiry(row);
                                  setOpenMenuId(null);
                                  setMenuPosition(null);
                                  setModalOpen(true);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  setDeleteConfirmId(row.id);
                                  setOpenMenuId(null);
                                  setMenuPosition(null);
                                }}
                              >
                                Delete
                              </button>
                            </div>,
                            document.body
                          )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === row.id && (row.parts ?? []).length > 0 && (
                    <tr key={`${row.id}-parts`} className="bg-muted/20">
                      <td colSpan={8} className="px-4 py-3">
                        <div className="rounded border border-border bg-card overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border bg-muted/30">
                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Part Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">OE Number</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Supplier date</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Price</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Cost</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Margin</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Margin %</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(row.parts ?? []).map((p) => (
                                <tr key={p.id} className="border-b border-border last:border-b-0">
                                  <td className="px-4 py-2">{p.part_name ?? "—"}</td>
                                  <td className="px-4 py-2">{p.oe_number ?? "—"}</td>
                                  <td className="px-4 py-2">
                                    {p.supplier_available_date
                                      ? formatDate(p.supplier_available_date)
                                      : "—"}
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    {editingPricePartId === p.id ? (
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        value={editingPriceValue}
                                        onChange={(e) => setEditingPriceValue(e.target.value)}
                                        onBlur={() => submitPartPriceEdit(row.id, p.id)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                        }}
                                        autoFocus
                                        className="w-24 text-xs rounded border border-input px-2 py-1"
                                      />
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => startEditingPartPrice(p)}
                                        className="text-foreground hover:text-muted-foreground"
                                      >
                                        {formatPrice(p.price)}
                                      </button>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    {editingCostPricePartId === p.id ? (
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        value={editingCostPriceValue}
                                        onChange={(e) => setEditingCostPriceValue(e.target.value)}
                                        onBlur={() => submitPartCostPriceEdit(row.id, p.id)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                        }}
                                        autoFocus
                                        className="w-24 text-xs rounded border border-input px-2 py-1"
                                      />
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => startEditingPartCostPrice(p)}
                                        className="text-foreground hover:text-muted-foreground"
                                      >
                                        {formatPrice(p.cost_price)}
                                      </button>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 text-right">{formatPrice(getPartMargin(p))}</td>
                                  <td className="px-4 py-2 text-right">
                                    {getPartMarginPct(p) != null ? `${getPartMarginPct(p)!.toFixed(1)}%` : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
