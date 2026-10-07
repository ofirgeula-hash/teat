'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/store';
import { finishedSessions, formatKg, sessionMinutes, sessionRecords, sessionVolume } from '@/lib/stats';
import { ChevronLeft, Trophy } from 'lucide-react';
import WorkoutCalendar from '@/components/WorkoutCalendar';

export default function HistoryPage() {
  const { sessions, workoutTypes } = useStore();
  const [now] = useState(() => Date.now());
  const [month, setMonth] = useState(() => {
    const d = new Date(now);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const done = finishedSessions(sessions);
  const inMonth = done.filter((s) => {
    const d = new Date(s.startedAt);
    return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
  });

  // Per-type count for the month, as a color legend under the calendar.
  const counts = workoutTypes
    .map((wt) => ({ wt, n: inMonth.filter((s) => s.workoutTypeId === wt.id).length }))
    .filter((c) => c.n > 0);

  return (
    <div className="p-4 space-y-5">
      <div className="pt-4">
        <h1 className="text-3xl font-extrabold text-white">היסטוריה</h1>
        <p className="text-muted text-sm mt-1">
          {inMonth.length} {inMonth.length === 1 ? 'אימון' : 'אימונים'} החודש · {done.length} בסך הכל
        </p>
      </div>

      <WorkoutCalendar month={month} onMonthChange={setMonth} sessions={done} now={now} />

      {counts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {counts.map(({ wt, n }) => (
            <span key={wt.id} className="flex items-center gap-1.5 bg-surface rounded-full px-3 py-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: wt.color }} />
              {wt.name}
              <span className="font-num font-bold text-sm text-white">{n}</span>
            </span>
          ))}
        </div>
      )}

      {inMonth.length === 0 ? (
        <div className="text-center py-8 text-muted text-sm">
          אין אימונים בחודש הזה. לחץ על יום בלוח כדי לסמן אימון שעשית.
        </div>
      ) : (
        <section className="space-y-2">
          {inMonth.map((s) => {
            const wt = workoutTypes.find((w) => w.id === s.workoutTypeId);
            const prs = sessionRecords(sessions, s).length;
            const d = new Date(s.startedAt);
            const body = (
              <>
                <div className="w-12 text-center shrink-0">
                  <div className="font-num font-bold text-3xl leading-none">{d.getDate()}</div>
                  <div className="text-[11px] text-muted mt-1">{d.toLocaleDateString('he-IL', { weekday: 'short' })}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{wt?.emoji} {wt?.name ?? 'אימון'}</div>
                  <div className="text-xs text-muted mt-1">
                    {s.sets.length > 0
                      ? <>{sessionMinutes(s)} דק׳ · {s.sets.length} סטים · {formatKg(sessionVolume(s))} ק״ג</>
                      : 'סומן ידנית'}
                  </div>
                </div>
                {prs > 0 && (
                  <span className="flex items-center gap-1 text-accent text-xs font-bold shrink-0">
                    <Trophy size={14} /> {prs}
                  </span>
                )}
              </>
            );
            const cls = 'flex items-center gap-4 bg-surface rounded-[22px] p-4 border-r-[5px]';
            return s.sets.length > 0 ? (
              <Link key={s.id} href={`/history/${s.id}`} className={`${cls} active:bg-surface-2`} style={{ borderRightColor: wt?.color }}>
                {body}
                <ChevronLeft size={18} className="text-faint shrink-0" />
              </Link>
            ) : (
              <div key={s.id} className={cls} style={{ borderRightColor: wt?.color }}>{body}</div>
            );
          })}
        </section>
      )}
    </div>
  );
}
