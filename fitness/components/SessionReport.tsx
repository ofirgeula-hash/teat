'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { formatKg, sessionMinutes, sessionRecords, sessionVolume, summarizeExercises } from '@/lib/stats';
import { ChevronRight, Trophy, Trash2 } from 'lucide-react';

interface SessionReportProps {
  sessionId: string;
  /** "summary" right after finishing a workout; "detail" when opened from history. */
  mode: 'summary' | 'detail';
}

export default function SessionReport({ sessionId, mode }: SessionReportProps) {
  const { sessions, workoutTypes, locations, deleteSession } = useStore();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const session = sessions.find((s) => s.id === sessionId);

  if (!session) {
    return (
      <div className="p-4 pt-16 text-center space-y-4">
        <div className="text-muted">האימון לא נמצא</div>
        <Link href="/history" className="inline-block bg-surface px-5 py-3 rounded-full text-sm">להיסטוריה</Link>
      </div>
    );
  }

  const wt = workoutTypes.find((w) => w.id === session.workoutTypeId);
  const loc = locations.find((l) => l.id === session.locationId);
  const volume = sessionVolume(session);
  const records = sessionRecords(sessions, session);
  const exercises = summarizeExercises(sessions, session);
  const date = new Date(session.startedAt);

  return (
    <div className="p-4 space-y-5">
      <div className="pt-4 flex items-center gap-3">
        {mode === 'detail' && (
          <button onClick={() => router.back()} aria-label="חזרה" className="w-11 h-11 rounded-full bg-surface flex items-center justify-center shrink-0">
            <ChevronRight size={20} />
          </button>
        )}
        <div className="min-w-0">
          <div className="text-sm text-muted">
            {mode === 'summary' ? 'כל הכבוד! האימון נשמר' : date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h1 className="text-2xl font-extrabold truncate">{wt?.emoji} {wt?.name ?? 'אימון'}</h1>
          {loc && <div className="text-xs text-muted">{loc.name}</div>}
        </div>
      </div>

      <section aria-label="נפח כולל" className="bg-surface rounded-[28px] p-6 text-center">
        <div className="text-sm text-muted">נפח כולל</div>
        <div className="font-num font-bold text-7xl text-accent leading-none mt-2">{formatKg(volume)}</div>
        <div className="text-sm text-muted mt-1">ק״ג הורמו</div>
        <div className="grid grid-cols-3 gap-2 mt-6">
          <Stat value={String(sessionMinutes(session))} label="דקות" />
          <Stat value={String(session.sets.length)} label="סטים" />
          <Stat value={String(exercises.length)} label="תרגילים" />
        </div>
      </section>

      {records.length > 0 && (
        <section className="bg-accent text-ink rounded-[28px] p-5 space-y-3">
          <div className="flex items-center gap-2 font-extrabold text-lg">
            <Trophy size={20} /> {records.length === 1 ? 'שיא אישי חדש' : `${records.length} שיאים אישיים חדשים`}
          </div>
          {records.map((r) => (
            <div key={r.exerciseName} className="flex items-baseline justify-between gap-3">
              <span className="font-medium truncate">{r.exerciseName}</span>
              <span className="shrink-0">
                <span className="font-num font-bold text-2xl">{formatKg(r.weight)}</span> ק״ג
                <span className="text-sm opacity-70"> (היה {formatKg(r.previousBest)})</span>
              </span>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm text-muted font-medium">תרגילים</h2>
        {exercises.map((ex) => {
          const diff = ex.previousVolume !== null ? ex.volume - ex.previousVolume : null;
          return (
            <div key={ex.name} className="bg-surface rounded-[22px] p-4 space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-bold">{ex.name}</div>
                {diff !== null && diff !== 0 && (
                  <div className={`text-xs font-bold shrink-0 ${diff > 0 ? 'text-accent' : 'text-muted'}`}>
                    {diff > 0 ? '▲' : '▼'} {formatKg(Math.abs(diff))} ק״ג נפח
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {ex.sets.map((s) => s.untracked ? (
                  <span key={s.id} className="bg-surface-2 rounded-2xl px-3 py-1.5 text-sm">
                    <span className="text-good font-medium">✓ בוצע</span>
                    {s.note && <span className="text-muted"> · {s.note}</span>}
                  </span>
                ) : (
                  <span key={s.id} className="bg-surface-2 rounded-full px-3 py-1.5 text-sm">
                    <span className="font-num font-bold text-base">{formatKg(s.weight)}</span>
                    <span className="text-muted"> × </span>
                    <span className="font-num font-bold text-base">{s.reps}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {mode === 'summary' ? (
        <Link href="/" className="block w-full h-14 rounded-full bg-accent text-ink font-extrabold text-base text-center leading-[3.5rem]">
          סיום
        </Link>
      ) : confirmDelete ? (
        <div className="flex gap-2">
          <button onClick={() => setConfirmDelete(false)} className="flex-1 h-12 rounded-full bg-surface text-white">ביטול</button>
          <button
            onClick={() => { deleteSession(session.id); router.push('/history'); }}
            className="flex-1 h-12 rounded-full bg-red-500/15 text-red-400 font-bold"
          >
            כן, מחק
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirmDelete(true)} className="w-full h-12 rounded-full text-faint text-sm flex items-center justify-center gap-2">
          <Trash2 size={15} /> מחק אימון
        </button>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-surface-2 rounded-2xl py-3">
      <div className="font-num font-bold text-3xl leading-none">{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}
