'use client';
import Link from 'next/link';
import { useStore } from '@/store';
import { finishedSessions, formatKg, sessionMinutes, sessionRecords, sessionVolume } from '@/lib/stats';
import { ChevronLeft, Trophy } from 'lucide-react';

export default function HistoryPage() {
  const { sessions, workoutTypes } = useStore();
  const done = finishedSessions(sessions);

  const groups: { label: string; items: typeof done }[] = [];
  for (const s of done) {
    const label = new Date(s.startedAt).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(s);
    else groups.push({ label, items: [s] });
  }

  return (
    <div className="p-4 space-y-6">
      <div className="pt-4">
        <h1 className="text-3xl font-extrabold text-white">היסטוריה</h1>
        <p className="text-muted text-sm mt-1">{done.length} אימונים שמורים</p>
      </div>

      {done.length === 0 && (
        <div className="text-center py-16 text-muted text-sm">עוד אין אימונים שמורים. האימון הראשון יופיע כאן.</div>
      )}

      {groups.map((g) => (
        <section key={g.label} className="space-y-2">
          <h2 className="text-sm text-muted font-medium">{g.label}</h2>
          {g.items.map((s) => {
            const wt = workoutTypes.find((w) => w.id === s.workoutTypeId);
            const prs = sessionRecords(sessions, s).length;
            const d = new Date(s.startedAt);
            return (
              <Link key={s.id} href={`/history/${s.id}`} className="flex items-center gap-4 bg-surface rounded-[22px] p-4 active:bg-surface-2">
                <div className="w-12 text-center shrink-0">
                  <div className="font-num font-bold text-3xl leading-none">{d.getDate()}</div>
                  <div className="text-[11px] text-muted mt-1">{d.toLocaleDateString('he-IL', { weekday: 'short' })}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{wt?.emoji} {wt?.name ?? 'אימון'}</div>
                  <div className="text-xs text-muted mt-1">
                    {sessionMinutes(s)} דק׳ · {s.sets.length} סטים · {formatKg(sessionVolume(s))} ק״ג
                  </div>
                </div>
                {prs > 0 && (
                  <span className="flex items-center gap-1 text-accent text-xs font-bold shrink-0">
                    <Trophy size={14} /> {prs}
                  </span>
                )}
                <ChevronLeft size={18} className="text-faint shrink-0" />
              </Link>
            );
          })}
        </section>
      ))}
    </div>
  );
}
