"use client";

import { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";

export type QuickEnquiryExtractData = {
  car_model: string;
  parts: {
    part_name: string;
    oe_number?: string | null;
  }[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onExtract: (data: QuickEnquiryExtractData) => void;
};

export default function QuickEnquiryModal({ open, onClose, onExtract }: Props) {
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  async function handleExtract() {
    const text = message.trim();
    if (!text && !image) return;
    setExtractError(null);
    setExtractLoading(true);
    try {
      const formData = new FormData();
      formData.append("message", text);
      if (image) formData.append("image", image);
      const res = await fetch("/api/enquiries/extract", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      console.log("MODAL_API_RESULT", data);
      if (!res.ok) {
        setExtractError(data.error ?? "Extraction failed.");
        return;
      }
      const forward = {
        car_model: typeof data.car_model === "string" ? data.car_model : "",
        parts: Array.isArray(data.parts)
          ? data.parts.map((p: { part_name?: string; oe_number?: string | null }) => ({
              part_name: typeof p.part_name === "string" ? p.part_name : "",
              oe_number: p.oe_number ?? null,
            }))
          : [],
      };
      console.log("MODAL_FORWARD_TO_PARENT", forward);
      onExtract(forward);
    } catch {
      setExtractError("Extraction failed.");
    } finally {
      setExtractLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-card p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Quick Enquiry
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Paste WhatsApp message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground resize-none"
              placeholder="Paste the customer message here…"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Image (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-foreground file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {image && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {image.name}
              </p>
            )}
          </div>
          {extractError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {extractError}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={extractLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleExtract}
              className="flex-1"
              disabled={extractLoading || (!message.trim() && !image)}
            >
              {extractLoading ? "Extracting…" : "Extract Details"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
