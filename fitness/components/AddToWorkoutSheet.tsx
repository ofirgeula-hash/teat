'use client';
import { useState } from 'react';
import { Check } from 'lucide-react';
import { useStore, planExerciseFromLibrary } from '@/store';
import { saveBankExercise, type BankExercise } from '@/lib/exerciseBank';

/** Bottom sheet: pick a workout (and location) to append a bank exercise to. Also saves it (★). */
export default function AddToWorkoutSheet({ exercise, onClose }: { exercise: BankExercise; onClose: () => void }) {
  const { workoutTypes, locations, locationPlans, settings, addPlanExercise } = useStore();
  const [locationId, setLocationId] = useState(locations[0]?.id ?? '');
  const [added, setAdded] = useState<string | null>(null);

  function inPlan(workoutTypeId: string) {
    return locationPlans.some(
      (p) => p.locationId === locationId && p.workoutTypeId === workoutTypeId && p.exercises.some((ex) => ex.bankId === exercise.id),
    );
  }

  function add(workoutTypeId: string) {
    if (inPlan(workoutTypeId)) return;
    const item = saveBankExercise(exercise);
    addPlanExercise(locationId, workoutTypeId, planExerciseFromLibrary(item, settings.defaultRestSeconds));
    setAdded(workoutTypeId);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={onClose}>
      <div
        className="w-full max-w-lg mx-auto bg-surface rounded-t-[28px] p-6 space-y-4 max-h-[85dvh] overflow-y-auto"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="text-xl font-extrabold">להוסיף לאיזה אימון?</div>
          <div className="text-sm text-muted mt-0.5">{exercise.nameHe} יתווסף בסוף האימון</div>
        </div>

        {locations.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => { setLocationId(loc.id); setAdded(null); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${locationId === loc.id ? 'bg-white text-ink' : 'bg-surface-2 text-muted'}`}
              >
                {loc.name}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {workoutTypes.map((wt) => {
            const already = inPlan(wt.id);
            return (
              <button
                key={wt.id}
                onClick={() => add(wt.id)}
                disabled={already}
                className="w-full flex items-center gap-3 bg-surface-2 rounded-2xl px-4 py-3.5 text-right active:bg-surface-3 disabled:active:bg-surface-2"
              >
                <span className="w-1.5 self-stretch rounded-full shrink-0" style={{ background: wt.color }} />
                <span className="text-lg shrink-0">{wt.emoji}</span>
                <span className="flex-1 font-semibold truncate">{wt.name}</span>
                {added === wt.id ? (
                  <span className="text-good text-sm font-medium flex items-center gap-1 shrink-0"><Check size={15} /> נוסף</span>
                ) : already ? (
                  <span className="text-faint text-xs shrink-0">כבר באימון</span>
                ) : null}
              </button>
            );
          })}
          {workoutTypes.length === 0 && <div className="text-center text-faint text-sm py-4">אין עדיין אימונים. צור אימון בדף הבית.</div>}
        </div>

        <button onClick={onClose} className="w-full h-12 rounded-full bg-surface-2 text-white font-medium">
          {added ? 'סיום' : 'ביטול'}
        </button>
      </div>
    </div>
  );
}
