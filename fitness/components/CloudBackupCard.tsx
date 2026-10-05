'use client';
import { useState } from 'react';
import { useStore } from '@/store';
import { useBackup, signInWithGoogle, signOutOfBackup, restoreFromCloud, keepThisDeviceData, backupNow } from '@/lib/cloudBackup';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';

function when(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('he-IL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function CloudBackupCard() {
  const { status, email, lastBackupAt, cloudUpdatedAt, cloudSessionCount, error } = useBackup();
  const localSessions = useStore((s) => s.sessions.filter((x) => x.endedAt).length);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const busy = status === 'loading' || status === 'checking' || status === 'syncing';

  return (
    <div className="bg-surface rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        {status === 'signed-out' || status === 'loading' ? <CloudOff size={18} className="text-muted" /> : <Cloud size={18} className="text-accent" />}
        <div className="text-sm font-medium text-white">גיבוי בענן</div>
        {busy && <Loader2 size={14} className="animate-spin text-muted" />}
      </div>

      {status === 'signed-out' && (
        <>
          <div className="text-xs text-muted">התחבר עם Google כדי שכל האימונים יגובו אוטומטית ויחזרו גם אם תחליף טלפון.</div>
          <button onClick={() => void signInWithGoogle()} className="w-full h-12 rounded-full bg-white text-ink font-bold text-sm">
            התחבר עם Google
          </button>
        </>
      )}

      {status === 'needs-decision' && (
        <div className="space-y-3">
          <div className="text-sm text-[#d4d4d8]">
            נמצא גיבוי בענן מ-{when(cloudUpdatedAt)} עם {cloudSessionCount ?? 0} אימונים. בטלפון הזה יש {localSessions} אימונים. מה לעשות?
          </div>
          <button onClick={() => void restoreFromCloud()} className="w-full h-12 rounded-full bg-accent text-ink font-bold text-sm">
            שחזר מהענן לטלפון הזה
          </button>
          <button onClick={() => void keepThisDeviceData()} className="w-full h-12 rounded-full bg-surface-2 text-white text-sm">
            השאר את הנתונים של הטלפון הזה ודרוס את הענן
          </button>
        </div>
      )}

      {email && status !== 'needs-decision' && status !== 'signed-out' && (
        <div className="space-y-3">
          <div className="text-xs text-muted">
            מחובר כ-<span className="text-white">{email}</span>
            <br />
            גיבוי אחרון: {when(lastBackupAt)}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => void backupNow(true)} disabled={busy} className="bg-surface-2 text-white px-4 py-2.5 rounded-xl text-sm disabled:opacity-40">
              גבה עכשיו
            </button>
            {confirmRestore ? (
              <button
                onClick={() => { setConfirmRestore(false); void restoreFromCloud(); }}
                className="bg-accent text-ink px-4 py-2.5 rounded-xl text-sm font-bold"
              >
                בטוח? זה יחליף את הנתונים בטלפון
              </button>
            ) : (
              <button onClick={() => setConfirmRestore(true)} disabled={busy} className="bg-surface-2 text-white px-4 py-2.5 rounded-xl text-sm disabled:opacity-40">
                שחזר מהענן
              </button>
            )}
            <button onClick={() => void signOutOfBackup()} className="text-faint px-2 py-2.5 text-sm">
              התנתק
            </button>
          </div>
        </div>
      )}

      {error && <div className="text-sm text-red-400">{error}</div>}
    </div>
  );
}
