'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react';
import { useStore } from '@/store';
import type { WorkoutSession, WorkoutType } from '@/types';

const WEEKDAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Month grid (Sunday first) where each workout day is filled with its workout type's color. */
export default function WorkoutCalendar({
  month,
  onMonthChange,
  sessions,
  now,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  sessions: WorkoutSession[];
  now: number;
}) {
  const { workoutTypes } = useStore();
  const [openDay, setOpenDay] = useState<string | null>(null);

  const byDay = new Map<string, WorkoutSession[]>();
  for (const s of sessions) {
    const k = dayKey(new Date(s.startedAt));
    byDay.set(k, [...(byDay.get(k) ?? []), s]);
  }
  const typeOf = (s: WorkoutSession) => workoutTypes.find((w) => w.id === s.workoutTypeId);

  const year = month.getFullYear();
  const m = month.getMonth();
  const leading = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const todayKey = dayKey(new Date(now));
  const isCurrentMonth = year === new Date(now).getFullYear() && m === new Date(now).getMonth();

  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <section aria-label="לוח אימונים" className="bg-surface rounded-[28px] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onMonthChange(new Date(year, m - 1, 1))}
          aria-label="החודש הקודם"
          className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center"
        >
          <ChevronRight size={18} />
        </button>
        <div className="text-lg font-extrabold">
          {month.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
        </div>
        <button
          onClick={() => onMonthChange(new Date(year, m + 1, 1))}
          disabled={isCurrentMonth}
          aria-label="החודש הבא"
          className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-faint font-medium">
        {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const k = dayKey(new Date(year, m, day));
          const list = byDay.get(k) ?? [];
          const future = k > todayKey;
          const first = list[0] ? typeOf(list[0]) : undefined;
          const color = first?.color ?? '#ff6b1a';
          return (
            <button
              key={k}
              disabled={future}
              onClick={() => setOpenDay(k)}
              aria-label={`${day}${list.length ? ` — ${list.map((s) => typeOf(s)?.name ?? 'אימון').join(', ')}` : ''}`}
              className={`relative aspect-[3/4] rounded-xl flex flex-col items-center justify-start pt-1 gap-0.5 overflow-hidden transition-transform active:scale-95 disabled:opacity-30 ${
                list.length ? '' : 'bg-surface-2/50'
              } ${k === todayKey ? 'outline-2 outline-offset-1 outline-white/80' : ''}`}
              style={list.length ? { background: `${color}33`, boxShadow: `inset 0 0 0 1.5px ${color}` } : undefined}
            >
              <span className={`font-num font-bold text-base leading-none ${list.length ? 'text-white' : 'text-muted'}`}>{day}</span>
              {list.length > 0 && (
                <>
                  <span className="text-lg leading-none">{first?.emoji ?? '🏋️'}</span>
                  <span className="text-[9px] leading-tight font-medium text-white/90 px-0.5 line-clamp-2 break-all">
                    {shortName(first)}
                  </span>
                  {list.length > 1 && (
                    <span className="absolute top-0.5 left-0.5 text-[9px] font-bold bg-white text-ink rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      {list.length}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {openDay && (
        <DaySheet day={openDay} sessions={byDay.get(openDay) ?? []} onClose={() => setOpenDay(null)} />
      )}
    </section>
  );
}

/** "חזה + יד אחורית" → "חזה" — the first word fits a calendar cell. */
function shortName(wt?: WorkoutType) {
  if (!wt) return 'אימון';
  return wt.name.split(/\s*[+,/]\s*/)[0];
}

function DaySheet({ day, sessions, onClose }: { day: string; sessions: WorkoutSession[]; onClose: () => void }) {
  const { workoutTypes, logPastWorkout, deleteSession } = useStore();
  const router = useRouter();
  const [adding, setAdding] = useState(sessions.length === 0);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [y, mo, d] = day.split('-').map(Number);
  const label = new Date(y, mo - 1, d).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={onClose}>
      <div
        className="w-full max-w-lg mx-auto bg-surface rounded-t-[28px] p-6 space-y-4 max-h-[85vh] overflow-y-auto"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="text-xl font-extrabold">{label}</div>
          <button onClick={onClose} aria-label="סגור" className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        {sessions.map((s) => {
          const wt = workoutTypes.find((w) => w.id === s.workoutTypeId);
          return (
            <div key={s.id} className="flex items-center gap-3 bg-surface-2 rounded-2xl p-3 border-r-[5px]" style={{ borderRightColor: wt?.color }}>
              <button
                onClick={() => s.sets.length > 0 && router.push(`/history/${s.id}`)}
                className="flex-1 min-w-0 flex items-center gap-3 text-right"
              >
                <span className="text-3xl">{wt?.emoji ?? '🏋️'}</span>
                <span className="min-w-0">
                  <span className="block font-bold truncate">{wt?.name ?? 'אימון'}</span>
                  <span className="block text-xs text-muted">
                    {s.sets.length > 0 ? `${s.sets.length} סטים · לפרטים` : 'סומן ידנית, בלי סטים'}
                  </span>
                </span>
              </button>
              {confirmDelete === s.id ? (
                <button onClick={() => { deleteSession(s.id); setConfirmDelete(null); }} className="text-red-400 text-xs font-bold px-2">
                  למחוק?
                </button>
              ) : (
                <button onClick={() => setConfirmDelete(s.id)} aria-label="מחק אימון" className="text-faint active:text-red-400 p-2">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          );
        })}

        {adding ? (
          <div className="space-y-2">
            <div className="text-sm text-muted">איזה אימון עשית ביום הזה?</div>
            <div className="grid grid-cols-2 gap-2">
              {workoutTypes.map((wt) => (
                <button
                  key={wt.id}
                  onClick={() => { logPastWorkout(wt.id, day); onClose(); }}
                  className="bg-surface-2 rounded-2xl p-3 flex items-center gap-2 text-right active:scale-[0.97] transition-transform border-r-[5px]"
                  style={{ borderRightColor: wt.color }}
                >
                  <span className="text-2xl">{wt.emoji}</span>
                  <span className="text-sm font-bold leading-tight">{wt.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="w-full border border-dashed border-line rounded-2xl py-3 text-muted text-sm">
            + סמן אימון נוסף ביום הזה
          </button>
        )}
      </div>
    </div>
  );
}
