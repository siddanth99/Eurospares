// components/ui/ClientOnlyDate.tsx
'use client';
import React, { useEffect, useState } from 'react';

type Props = {
  isoDate?: string | null;            // the stable ISO date string OR Date
  mode?: 'relative' | 'short' | 'long';
  locale?: string;                    // optional locale (e.g., 'en-GB' or 'en-US')
};

function timeAgoFromDate(d: Date) {
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return null;
}

export default function ClientOnlyDate({ isoDate, mode = 'relative', locale }: Props) {
  const [text, setText] = useState<string>('');

  useEffect(() => {
    if (!isoDate) { setText(''); return; }
    const d = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;

    if (mode === 'relative') {
      const ago = timeAgoFromDate(d);
      if (ago) {
        setText(`${ago} ago`);
        return;
      }
      // else fallthrough to formatted date for older items
    }

    const usedLocale = locale ?? (navigator?.language || 'en-US');

    if (mode === 'short') {
      setText(d.toLocaleDateString(usedLocale));
    } else {
      setText(d.toLocaleString(usedLocale, { year: 'numeric', month: 'short', day: 'numeric' }));
    }
  }, [isoDate, mode, locale]);

  return <span>{text}</span>;
}
