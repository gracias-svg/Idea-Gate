'use client';

// src/components/ui/ThemeSync.tsx
// Mission 17 — Applies the colorScheme setting from GlobalStore to <html> as
// a CSS class ('dark' or 'light'), enabling the CSS variable overrides in
// globals.css. Mounted inside GlobalStore in layout.tsx. Renders nothing.

import { useEffect } from 'react';
import { useSettings } from '@/lib/GlobalStore';

export default function ThemeSync() {
  const { colorScheme } = useSettings();
  useEffect(() => {
    const html = document.documentElement;
    if (colorScheme === 'light') {
      html.classList.add('light');
      html.classList.remove('dark');
    } else {
      html.classList.add('dark');
      html.classList.remove('light');
    }
  }, [colorScheme]);
  return null;
}
