'use client'

import React, { useEffect, useState } from "react";

type Props = {
  value: number; // current radius in km
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
};

export default function LocationRadiusSlider({
  value = 5,
  onChange,
  min = 0,
  max = 200,
  step = 1,
  id = "location-radius",
}: Props) {
  // text state allows free typing (so user can clear and type "20")
  const [text, setText] = useState(() => (value || value === 0 ? String(value) : "5"));

  // keep text in sync when external value changes
  useEffect(() => {
    setText(value || value === 0 ? String(value) : "");
  }, [value]);

  function commitText() {
    // remove non-digits, allow empty
    const cleaned = text.trim().replace(/[^\d]/g, "");
    if (cleaned === "") {
      // treat empty as 0 or no filter -- choose 0 (no radius)
      onChange(0);
      setText("0");
      return;
    }
    let n = Number(cleaned);
    if (Number.isNaN(n)) n = 0;
    n = Math.max(min, Math.min(max, Math.round(n)));
    onChange(n);
    setText(String(n));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <input
          aria-label="Location radius slider"
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value ?? 0}
          onChange={(e) => onChange(Math.round(Number(e.target.value)))}
          className="w-full"
        />
        <input
          aria-label="Radius (km) numeric"
          inputMode="numeric"
          pattern="[0-9]*"
          className="w-20 p-2 rounded-md bg-background border border-border text-foreground"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => commitText()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commitText();
              (e.target as HTMLInputElement).blur();
            }
            if (e.key === "Escape") {
              // revert to current numeric value
              setText(value || value === 0 ? String(value) : "");
            }
          }}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Show chores within {value ?? 0} km of your location.
      </p>
    </div>
  );
}

