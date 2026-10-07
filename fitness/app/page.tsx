'use client';
import { useStore, nextWorkoutColor } from '@/store';
import { useRouter } from 'next/navigation';
import type { WorkoutKind, WorkoutType } from '@/types';
import { WORKOUT_COLORS } from '@/types';
import { Weight, Plus, Edit2, Check, X, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { finishedSessions, workoutsThisWeek, weekStreak } from '@/lib/stats';
import WeekRing from '@/components/WeekRing';

export default function HomePage() {
  const { workoutTypes, sessions, settings, addWorkoutType } = useStore();
  const router = useRouter();
  const [now] = useState(() => Date.now());
  const [showAddWt, setShowAddWt] = useState(false);
  const [newWtName, setNewWtName] = useState('');
  const [newWtEmoji, setNewWtEmoji] = useState('🏋️');

  const goal = settings.weeklyGoal ?? 4;
  const thisWeek = workoutsThisWeek(sessions, now);
  const streak = weekStreak(sessions, goal, now);
  const done = finishedSessions(sessions);

  function addWt() {
    if (!newWtName.trim()) return;
    addWorkoutType({
      id: crypto.randomUUID(),
      name: newWtName.trim(),
      emoji: newWtEmoji,
      color: nextWorkoutColor(workoutTypes.map((w) => w.color)),
      kind: 'split',
    });
    setNewWtName('');
    setNewWtEmoji('🏋️');
    setShowAddWt(false);
  }

  return (
    <div className="p-4 space-y-6">
      <div className="pt-4">
        <p className="text-muted text-sm">
          {new Date(now).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="text-3xl font-extrabold text-white mt-1">יאללה, לזוז</h1>
      </div>

      <section aria-label="התקדמות שבועית" className="bg-surface rounded-[28px] p-5 flex items-center gap-5">
        <WeekRing value={thisWeek} goal={goal} />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="text-sm text-muted">השבוע</div>
          <div className="text-2xl font-extrabold leading-tight">
            {thisWeek >= goal ? 'היעד הושג!' : `עוד ${goal - thisWeek} ${goal - thisWeek === 1 ? 'אימון' : 'אימונים'}`}
          </div>
          <div className="text-sm text-muted">
            {streak > 0 ? (
              <>רצף של <span className="text-accent font-bold">{streak}</span> {streak === 1 ? 'שבוע' : 'שבועות'} ביעד</>
            ) : (
              'השלם את היעד השבועי כדי להתחיל רצף'
            )}
          </div>
        </div>
      </section>


      <div>
        <h2 className="text-sm text-muted font-medium mb-3">בחר אימון</h2>
        <div className="grid grid-cols-2 gap-3">
          {workoutTypes.map((wt) => {
            const lastSession = done.find((s) => s.workoutTypeId === wt.id);
            const daysAgo = lastSession
              ? Math.floor((now - new Date(lastSession.startedAt).getTime()) / 86400000)
              : null;
            return (
              <WorkoutCard
                key={wt.id}
                wt={wt}
                daysAgo={daysAgo}
                onPress={() => router.push(`/workout/${wt.id}`)}
              />
            );
          })}

          {showAddWt ? (
            <div className="bg-surface rounded-[22px] p-3 flex flex-col gap-2 col-span-2">
              <div className="flex gap-2">
                <input
                  value={newWtEmoji}
                  onChange={(e) => setNewWtEmoji(e.target.value)}
                  aria-label="אמוג׳י"
                  className="w-12 bg-surface-2 rounded-xl px-1 py-2 text-white text-center text-lg border border-line focus:outline-none"
                  maxLength={2}
                />
                <input
                  value={newWtName}
                  onChange={(e) => setNewWtName(e.target.value)}
                  placeholder="שם סוג אימון"
                  aria-label="שם סוג אימון"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && addWt()}
                  className="flex-1 bg-surface-2 rounded-xl px-3 py-2 text-white text-sm border border-line focus:border-accent focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddWt(false)} className="flex-1 bg-surface-2 text-[#d4d4d8] py-2.5 rounded-xl text-sm">ביטול</button>
                <button onClick={addWt} className="flex-1 bg-accent text-ink py-2.5 rounded-xl text-sm font-bold">הוסף</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddWt(true)}
              className="rounded-[22px] p-4 flex flex-col items-center justify-center gap-2 text-faint border border-dashed border-line active:bg-surface min-h-[120px]"
            >
              <Plus size={24} />
              <span className="text-xs">הוסף אימון</span>
            </button>
          )}
        </div>
      </div>

      <BodyWeightQuickAdd />
    </div>
  );
}

function WorkoutCard({ wt, daysAgo, onPress }: { wt: WorkoutType; daysAgo: number | null; onPress: () => void }) {
  const { updateWorkoutType, deleteWorkoutType } = useStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(wt.name);
  const [emoji, setEmoji] = useState(wt.emoji);
  const [kind, setKind] = useState<WorkoutKind>(wt.kind ?? 'split');
  const [color, setColor] = useState(wt.color);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function save() {
    updateWorkoutType(wt.id, { name: name.trim() || wt.name, emoji: emoji || wt.emoji, kind, color });
    setEditing(false);
    setConfirmDelete(false);
  }

  function cancelEdit() {
    setName(wt.name);
    setEmoji(wt.emoji);
    setKind(wt.kind ?? 'split');
    setColor(wt.color);
    setEditing(false);
    setConfirmDelete(false);
  }

  if (editing) {
    return (
      <div className="bg-surface rounded-[22px] p-3 flex flex-col gap-2.5 col-span-2">
        <div className="flex gap-2">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-10 bg-surface-2 rounded px-1 py-1 text-white text-center border border-line focus:outline-none"
            maxLength={2}
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            autoFocus
            className="flex-1 bg-surface-2 rounded px-2 py-1 text-white text-sm border border-accent focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-1 bg-surface-2 rounded-xl p-1" role="radiogroup" aria-label="סוג אימון">
          {(['full', 'split'] as const).map((k) => (
            <button
              key={k}
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className={`py-2 rounded-lg text-sm font-bold transition-colors ${kind === k ? 'bg-white text-ink' : 'text-muted'}`}
            >
              {k === 'full' ? 'פול באדי' : 'חלוקה'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 justify-between" role="radiogroup" aria-label="צבע בלוח השנה">
          {WORKOUT_COLORS.map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={color === c}
              aria-label={`צבע ${c}`}
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''}`}
              style={{ background: c }}
            />
          ))}
        </div>
        {confirmDelete ? (
          <div className="flex items-center gap-2 justify-end">
            <span className="text-red-400 text-xs">מחק את &apos;{wt.name}&apos;?</span>
            <button onClick={() => deleteWorkoutType(wt.id)} className="text-red-400 text-xs font-medium">כן</button>
            <button onClick={() => setConfirmDelete(false)} className="text-muted text-xs">ביטול</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelete(true)} className="text-red-400"><Trash2 size={14} /></button>
            <div className="flex-1" />
            <button onClick={cancelEdit} className="text-muted"><X size={16} /></button>
            <button onClick={save} className="text-good"><Check size={16} /></button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={onPress}
        className="w-full bg-surface rounded-[22px] p-4 text-right flex flex-col gap-3 active:scale-[0.97] transition-transform min-h-[120px]"
      >
        <div className="flex items-center gap-2">
          <span className="text-3xl">{wt.emoji}</span>
          <span className="w-2 h-2 rounded-full" style={{ background: wt.color }} aria-hidden />
          {wt.kind === 'full' && <span className="text-[10px] font-bold text-muted bg-surface-2 rounded-full px-2 py-0.5">פול באדי</span>}
        </div>
        <div className="font-bold text-white text-base leading-tight">{wt.name}</div>
        <div className={`text-xs ${daysAgo !== null && daysAgo >= 7 ? 'text-accent' : 'text-muted'}`}>
          {daysAgo === null ? 'עוד לא בוצע' : daysAgo === 0 ? 'בוצע היום' : daysAgo === 1 ? 'אתמול' : `לפני ${daysAgo} ימים`}
        </div>
      </button>
      <button
        onClick={() => setEditing(true)}
        aria-label={`עריכת ${wt.name}`}
        className="absolute top-2 left-2 w-9 h-9 flex items-center justify-center text-faint active:text-white"
      >
        <Edit2 size={14} />
      </button>
    </div>
  );
}

function BodyWeightQuickAdd() {
  const { addBodyWeight } = useStore();
  const [val, setVal] = useState('');
  const [saved, setSaved] = useState(false);

  function save() {
    const w = parseFloat(val);
    if (!w || w < 20 || w > 300) return;
    addBodyWeight({ id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), weightKg: w });
    setVal('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-surface rounded-[22px] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Weight size={18} className="text-accent" />
        <span className="text-sm font-medium">הזן משקל גוף</span>
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder='ק"ג'
          className="flex-1 bg-surface-2 rounded-lg px-3 py-2 text-white text-sm border border-line focus:border-accent focus:outline-none"
          step="0.1"
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
        <button
          onClick={save}
          className="bg-accent text-ink px-4 py-2 rounded-lg text-sm font-medium active:bg-accent-soft"
        >
          {saved ? '✓' : 'שמור'}
        </button>
      </div>
    </div>
  );
}
