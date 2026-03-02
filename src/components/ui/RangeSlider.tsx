'use client'

import * as React from 'react'

import * as SliderPrimitive from '@radix-ui/react-slider'

type RangeSliderProps = {
  value: [number, number]
  min?: number
  max?: number
  step?: number
  onChange: (v: [number, number]) => void
}

export default function RangeSlider({ value, min = 0, max = 10000, step = 100, onChange }: RangeSliderProps) {
  return (
    <div className="py-2">
      <SliderPrimitive.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={(vals) => onChange([vals[0], vals[1]] as [number, number])}
        aria-label="Budget range"
      >
        <SliderPrimitive.Track className="relative bg-muted h-1 rounded-full">
          <SliderPrimitive.Range className="absolute bg-primary h-full rounded-full" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb 
          className="block w-4 h-4 bg-white rounded-full shadow-md border border-gray-300"
          aria-label="Minimum budget"
        />
        <SliderPrimitive.Thumb 
          className="block w-4 h-4 bg-white rounded-full shadow-md border border-gray-300"
          aria-label="Maximum budget"
        />
      </SliderPrimitive.Root>
    </div>
  )
}

