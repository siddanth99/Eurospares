"use client";

import { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";

export type QuickEnquiryExtractData = {
  car_model: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  chassis_number?: string | null;
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
  const [images, setImages] = useState<File[]>([]);
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

  useEffect(() => {
    if (!open) {
      setMessage("");
      setImages([]);
      setExtractError(null);
    }
  }, [open]);

  if (!open) return null;

  async function handleExtract() {
    const text = message.trim();
    if (!text && images.length === 0) return;
    setExtractError(null);
    setExtractLoading(true);
    try {
      const formData = new FormData();
      formData.append("message", text);
      images.forEach((img) => {
        formData.append("image", img);
      });
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
      const forward: QuickEnquiryExtractData = {
        car_model: typeof data.car_model === "string" ? data.car_model : "",
        customer_name:
          typeof data.customer_name === "string" ? data.customer_name : null,
        customer_phone:
          typeof data.customer_phone === "string" ? data.customer_phone : null,
        chassis_number:
          typeof data.chassis_number === "string" ? data.chassis_number : null,
        parts: Array.isArray(data.parts)
          ? (data.parts as any[]).map((p) => ({
              part_name:
                typeof p.part_name === "string" ? p.part_name : "",
              oe_number:
                typeof p.oe_number === "string" || p.oe_number === null
                  ? p.oe_number
                  : null,
            }))
          : [],
      };
      console.log("MODAL_FORWARD_TO_PARENT", forward);
      onExtract(forward);
      setMessage("");
      setImages([]);
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
          <div
            onDrop={(e) => {
              e.preventDefault();
              const files = Array.from(e.dataTransfer.files);
              const imageFiles = files.filter((f) => f.type.startsWith("image/"));
              if (imageFiles.length) {
                setImages((prev) => [...prev, ...imageFiles]);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Paste WhatsApp message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onPaste={(e) => {
                const items = e.clipboardData?.items;
                if (!items) return;
                const pastedImages: File[] = [];
                for (const item of items) {
                  if (item.type.startsWith("image/")) {
                    const file = item.getAsFile();
                    if (file) pastedImages.push(file);
                  }
                }
                if (pastedImages.length > 0) {
                  e.preventDefault();
                  setImages((prev) => [...prev, ...pastedImages]);
                }
              }}
              rows={6}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground resize-none"
              placeholder="Paste the customer message here… or drop images here"
            />
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {images.map((img, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(img)}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-black text-white text-xs px-1"
                      onClick={() =>
                        setImages((prev) => prev.filter((_, idx) => idx !== i))
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Images (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) {
                  setImages((prev) => [...prev, ...files]);
                }
              }}
              className="w-full text-sm text-foreground file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
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
              disabled={extractLoading || (!message.trim() && images.length === 0)}
            >
              {extractLoading ? "Extracting…" : "Extract Details"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
