'use client';
import { useEffect } from 'react';

/** Registers public/sw.js, which keeps saved exercises' photos available without reception. */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  return null;
}
