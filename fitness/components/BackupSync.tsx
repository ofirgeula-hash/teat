'use client';
import { useEffect } from 'react';
import { startBackupSync } from '@/lib/cloudBackup';

/** Mounted once in the layout: restores the Google session and auto-backs-up changes. */
export default function BackupSync() {
  useEffect(() => {
    void startBackupSync();
  }, []);
  return null;
}
