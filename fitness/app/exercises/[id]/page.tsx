'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Plus, SquarePlay, Star } from 'lucide-react';
import { useStore } from '@/store';
import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS } from '@/types';
import { finishedSessions, formatKg } from '@/lib/stats';
import {
  CATEGORY_LABELS, FORCE_LABELS, LEVEL_LABELS, MECHANIC_LABELS,
  saveBankExercise, unsaveBankExercise, useBank,
} from '@/lib/exerciseBank';
import ExerciseImage from '@/components/ExerciseImage';
import BodyMap from '@/components/BodyMap';
import AddToWorkoutSheet from '@/components/AddToWorkoutSheet';

export default function ExercisePage() {
  const { id } = useParams<{ id: string }>();
  const bankId = decodeURIComponent(id);
  const router = useRouter();
  const bank = useBank();
  const { exerciseLibrary, locationPlans, sessions, updateExerciseLibraryItem } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [noteDraft, setNoteDraft] = useState<string | null>(null);

  const exercise = bank?.find((e) => e.id === bankId);
  const saved = exerciseLibrary.find((e) => e.bankId === bankId);

  // Sets are stored by exercise name, so collect every name this exercise has had in plans.
  const names = useMemo(() => {
    const set = new Set<string>();
    if (exercise) set.add(exercise.nameHe);
    if (saved) set.add(saved.nameHe || saved.name);
    for (const p of locationPlans) for (const ex of p.exercises) if (ex.bankId === bankId) set.add(ex.name);
    return set;
  }, [exercise, saved, locationPlans, bankId]);

  const history = useMemo(() => {
    return finishedSessions(sessions)
      .map((s) => ({ session: s, sets: s.sets.filter((st) => names.has(st.exerciseName)).sort((a, b) => a.setNumber - b.setNumber) }))
      .filter((h) => h.sets.length > 0);
  }, [sessions, names]);

  if (!bank) return <div className="text-center text-faint py-24 text-sm">טוען…</div>;
  if (!exercise) {
    return (
      <div className="p-4 pt-16 text-center space-y-4">
        <div className="text-muted">התרגיל לא נמצא</div>
        <Link href="/exercises" className="inline-block bg-surface px-5 py-3 rounded-full text-sm">לבנק התרגילים</Link>
      </div>
    );
  }

  const tracked = history.flatMap((h) => h.sets).filter((s) => !s.untracked && s.reps > 0);
  const maxWeight = tracked.length ? Math.max(...tracked.map((s) => s.weight)) : null;
  const maxReps = tracked.length ? Math.max(...tracked.map((s) => s.reps)) : null;
  const note = noteDraft ?? saved?.keyPoints ?? '';

  function saveNote() {
    if (noteDraft === null || !exercise) return;
    const item = saveBankExercise(exercise);
    updateExerciseLibraryItem(item.id, { keyPoints: noteDraft.trim() || undefined });
    setNoteDraft(null);
  }

  const facts: [string, string][] = [
    ['ציוד', EQUIPMENT_LABELS[exercise.equipment]],
    ['רמה', LEVEL_LABELS[exercise.level]],
    ...(exercise.mechanic ? [['סוג', MECHANIC_LABELS[exercise.mechanic]] as [string, string]] : []),
    ...(exercise.force ? [['תנועה', FORCE_LABELS[exercise.force]] as [string, string]] : []),
  ];
  if (exercise.category !== 'strength') facts.push(['קטגוריה', CATEGORY_LABELS[exercise.category]]);

  return (
    <div className="pb-6">
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => router.back()} aria-label="חזרה" className="w-11 h-11 rounded-full bg-surface flex items-center justify-center shrink-0">
          <ChevronRight size={20} />
        </button>
        <div className="flex-1 min-w-0 text-center">
          <h1 className="font-bold text-lg leading-tight">{exercise.nameHe}</h1>
          <div className="text-xs text-faint truncate" dir="ltr">{exercise.name}</div>
        </div>
        <button
          onClick={() => (saved ? unsaveBankExercise(bankId) : saveBankExercise(exercise))}
          aria-label={saved ? 'הסר מהשמורים' : 'שמור'}
          aria-pressed={!!saved}
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${saved ? 'bg-accent text-ink' : 'bg-surface text-white'}`}
        >
          <Star size={18} className={saved ? 'fill-ink' : ''} />
        </button>
      </div>

      <div className="px-4">
        <ExerciseImage bankId={exercise.id} alt={exercise.nameHe} animate className="aspect-[3/2] rounded-[22px]" />
      </div>

      <div className="px-4 pt-3 grid grid-cols-2 gap-2">
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.name} exercise`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="h-11 rounded-xl bg-surface-2 text-sm font-medium flex items-center justify-center gap-2 active:bg-surface-3"
        >
          <SquarePlay size={17} className="text-[#ff4e45]" /> סרטון ביוטיוב
        </a>
        <button
          onClick={() => setShowAdd(true)}
          className="h-11 rounded-xl bg-accent text-ink text-sm font-bold flex items-center justify-center gap-1.5"
        >
          <Plus size={17} strokeWidth={2.6} /> הוסף לאימון
        </button>
      </div>

      <Section title="שרירי מטרה">
        <div className="bg-surface rounded-[22px] border border-line pt-4 pb-3">
          <BodyMap primary={exercise.primary} secondary={exercise.secondary} />
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted mt-3 px-3">
            <span className="flex items-center gap-1.5">
              <i className="w-2.5 h-2.5 rounded-sm bg-accent" />
              ראשי: {exercise.primary.map((m) => MUSCLE_GROUP_LABELS[m]).join(', ')}
            </span>
            {exercise.secondary.length > 0 && (
              <span className="flex items-center gap-1.5">
                <i className="w-2.5 h-2.5 rounded-sm bg-[#ffb37a]" />
                משני: {exercise.secondary.map((m) => MUSCLE_GROUP_LABELS[m]).join(', ')}
              </span>
            )}
          </div>
        </div>
      </Section>

      <div className="px-4 pt-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${facts.length}, minmax(0, 1fr))` }}>
        {facts.map(([label, value]) => (
          <div key={label} className="bg-surface border border-line rounded-2xl py-2.5 text-center">
            <div className="text-[11px] text-faint">{label}</div>
            <div className="text-sm font-semibold mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      {exercise.category === 'strength' && (
        <Section title="השיאים שלי">
          {tracked.length === 0 ? (
            <div className="bg-surface rounded-2xl px-4 py-3 text-sm text-faint">עוד לא רשמת סטים בתרגיל הזה</div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <Stat value={formatKg(maxWeight!)} label="משקל מקס׳ (ק״ג)" />
              <Stat value={String(maxReps)} label="חזרות מקס׳" />
              <Stat value={String(history.length)} label="אימונים" />
            </div>
          )}
        </Section>
      )}

      {history.length > 0 && (
        <Section title="היסטוריה">
          <div className="space-y-1.5">
            {history.slice(0, 6).map(({ session, sets }) => (
              <Link
                key={session.id}
                href={`/history/${session.id}`}
                className="flex items-center justify-between gap-3 bg-surface rounded-2xl px-4 py-3 active:bg-surface-2"
              >
                <span className="text-sm text-muted shrink-0">
                  {new Date(session.startedAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                </span>
                <span className="text-sm font-num tracking-wide truncate" dir="ltr">
                  {sets.some((s) => s.untracked)
                    ? 'בוצע'
                    : sets.map((s) => `${formatKg(s.weight)}×${s.reps}`).join('  ·  ')}
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section title="איך מבצעים">
        <ol className="space-y-2.5">
          {exercise.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-[#d4d4d8]">
              <span className="w-6 h-6 rounded-lg bg-surface-3 text-accent font-num font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="ההערות שלי">
        <textarea
          value={note}
          onChange={(e) => setNoteDraft(e.target.value)}
          onBlur={saveNote}
          rows={3}
          placeholder="דגשים שלך לתרגיל (נשמר אוטומטית)"
          className="w-full bg-surface rounded-2xl px-4 py-3 text-base text-white border border-line focus:border-accent focus:outline-none resize-none"
        />
      </Section>

      {showAdd && <AddToWorkoutSheet exercise={exercise} onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-4 pt-5">
      <h2 className="text-base font-semibold mb-2.5">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-surface border border-line rounded-2xl py-3 text-center">
      <div className="font-num font-bold text-3xl leading-none">{value}</div>
      <div className="text-[11px] text-muted mt-1">{label}</div>
    </div>
  );
}
