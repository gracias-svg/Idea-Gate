'use client';

// src/app/office/page.tsx
// Mission 10 — /office is retired. Redirect to /mission-control.
// Preserves bookmarks and existing links without a 404.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OfficeRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/mission-control'); }, [router]);
  return null;
}
