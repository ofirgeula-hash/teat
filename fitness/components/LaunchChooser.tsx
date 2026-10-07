'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '@/store';
import { finishedSessions } from '@/lib/stats';
import type { WorkoutKind, WorkoutType } from '@/types';

const LAST_ACTIVE_KEY = 'fitness-last-active';
/** Opening the app after this long away starts on the chooser. */
const AWAY_MS = 2 * 60 * 60 * 1000;
/** A half-logged workout untouched this long is saved as-is. */
const STALE_SESSION_MS = 3 * 60 * 60 * 1000;

function readLastActive(): number {
  try {
    return Number(localStorage.getItem(LAST_ACTIVE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function markActive() {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  } catch {}
}

function daysAgoLabel(days: number | null) {
  if (days === null) return 'עוד לא בוצע';
  if (days === 0) return 'בוצע היום';
  if (days === 1) return 'אתמול';
  return `לפני ${days} ימים`;
}

/** Full-screen "what are we training today?" picker shown when the app is opened after a break. */
export default function LaunchChooser() {
  const pathname = usePathname();
  const router = useRouter();
  const { workoutTypes, sessions, closeStaleSession } = useStore();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'root' | WorkoutKind>('root');
  const [openedAt, setOpenedAt] = useState(0);
  const pathRef = useRef(pathname);
  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    function check() {
      closeStaleSession(STALE_SESSION_MS);
      const away = Date.now() - readLastActive() > AWAY_MS;
      // Never interrupt a workout that's on screen.
      if (away && !pathRef.current.startsWith('/workout')) {
        setStep('root');
        setOpenedAt(Date.now());
        setOpen(true);
      }
      markActive();
    }
    function onVisibility() {
      if (document.visibilityState === 'visible') check();
      else markActive();
    }
    check();
    document.addEventListener('visibilitychange', onVisibility);
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') markActive();
    }, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(t);
    };
  }, [closeStaleSession]);

  if (!open) return null;

  const now = openedAt;
  const done = finishedSessions(sessions);
  const daysSince = (wt: WorkoutType) => {
    const last = done.find((s) => s.workoutTypeId === wt.id);
    return last ? Math.floor((now - new Date(last.startedAt).getTime()) / 86400000) : null;
  };
  const full = workoutTypes.filter((w) => w.kind === 'full');
  const split = workoutTypes.filter((w) => w.kind !== 'full');
  // Suggest whichever was done longest ago (never-done first).
  const suggest = (list: WorkoutType[]) =>
    [...list].sort((a, b) => (daysSince(b) ?? Infinity) - (daysSince(a) ?? Infinity))[0];

  function go(wt: WorkoutType) {
    setOpen(false);
    router.push(`/workout/${wt.id}`);
  }

  function pickKind(kind: WorkoutKind) {
    const list = kind === 'full' ? full : split;
    if (list.length === 1) go(list[0]);
    else setStep(kind);
  }

  const splitNext = suggest(split);
  const fullNext = full.length === 1 ? full[0] : undefined;

  return (
    <div
      className="fixed inset-0 z-[60] bg-ink flex flex-col"
      style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))', paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-lg w-full mx-auto flex-1 flex flex-col px-4 gap-4 min-h-0">
        {step === 'root' ? (
          <div key="root" className="chooser-in flex-1 flex flex-col gap-4 min-h-0">
            <div className="pt-4">
              <p className="text-muted text-sm">
                {new Date(now).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <h1 className="text-3xl font-extrabold mt-1">מה מתאמנים היום?</h1>
            </div>

            <button
              onClick={() => pickKind('full')}
              className="flex-1 min-h-[160px] rounded-[32px] bg-accent text-ink p-6 flex flex-col justify-between text-right active:scale-[0.98] transition-transform"
            >
              <span className="text-6xl">🔥</span>
              <span>
                <span className="block text-4xl font-extrabold">פול באדי</span>
                <span className="block text-sm font-medium opacity-75 mt-1">
                  {full.length === 0
                    ? 'אין עדיין — סמן אימון כ״פול באדי״ בעריכה'
                    : fullNext
                    ? daysAgoLabel(daysSince(fullNext))
                    : `${full.length} אימונים`}
                </span>
              </span>
            </button>

            <button
              onClick={() => pickKind('split')}
              className="flex-1 min-h-[160px] rounded-[32px] bg-surface border border-line p-6 flex flex-col justify-between text-right active:scale-[0.98] transition-transform"
            >
              <span className="text-6xl">🧩</span>
              <span>
                <span className="block text-4xl font-extrabold">חלוקה</span>
                <span className="block text-sm text-muted mt-1">
                  {split.length === 0
                    ? 'אין אימוני חלוקה'
                    : <>{split.length} אימונים · הבא בתור: <span className="text-white font-bold">{splitNext?.name}</span></>}
                </span>
              </span>
            </button>
          </div>
        ) : (
          <div key={step} className="chooser-in flex-1 flex flex-col gap-3 min-h-0">
            <div className="pt-4 flex items-center gap-3">
              <button
                onClick={() => setStep('root')}
                aria-label="חזרה"
                className="w-11 h-11 rounded-full bg-surface flex items-center justify-center shrink-0"
              >
                <ChevronRight size={20} />
              </button>
              <h1 className="text-3xl font-extrabold">{step === 'full' ? 'פול באדי' : 'איזו חלוקה?'}</h1>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-2">
              {(step === 'full' ? full : split).length === 0 && (
                <div className="text-center text-muted text-sm py-16">
                  אין אימונים מהסוג הזה. במסך הראשי, לחץ על העיפרון של אימון ובחר את הסוג שלו.
                </div>
              )}
              {(step === 'full' ? full : split).map((wt) => {
                const days = daysSince(wt);
                const recommended = wt.id === suggest(step === 'full' ? full : split)?.id;
                return (
                  <button
                    key={wt.id}
                    onClick={() => go(wt)}
                    className="w-full bg-surface rounded-[26px] p-5 flex items-center gap-4 text-right active:scale-[0.98] transition-transform border-r-[6px]"
                    style={{ borderRightColor: wt.color }}
                  >
                    <span className="text-5xl shrink-0">{wt.emoji}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xl font-extrabold truncate">{wt.name}</span>
                      <span className={`block text-sm mt-1 ${days !== null && days >= 7 ? 'text-accent' : 'text-muted'}`}>
                        {daysAgoLabel(days)}
                      </span>
                    </span>
                    {recommended && (
                      <span className="text-[11px] font-bold bg-accent text-ink rounded-full px-2.5 py-1 shrink-0">הבא בתור</span>
                    )}
                    <ChevronLeft size={20} className="text-faint shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button onClick={() => setOpen(false)} className="text-muted text-sm py-3 shrink-0">
          למסך הראשי
        </button>
      </div>
    </div>
  );
}
