import * as React from "react";
import { cn } from "@/src/lib/utils";

interface SliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ 
    value = [0], 
    onValueChange, 
    min = 0, 
    max = 100, 
    step = 1, 
    disabled = false, 
    className,
    "aria-label": ariaLabel 
  }, ref) => {
    const percentage = ((value[0] - min) / (max - min)) * 100;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      onValueChange?.([newValue]);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
      >
        <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <div 
            className="absolute h-full bg-primary" 
            style={{ width: `${percentage}%` }} 
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={handleChange}
          disabled={disabled}
          aria-label={ariaLabel}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute block h-5 w-5 rounded-full border-2 border-primary bg-background shadow transition-colors"
          style={{ left: `calc(${percentage}% - 10px)` }}
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
