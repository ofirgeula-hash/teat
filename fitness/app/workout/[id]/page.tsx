'use client';
import { useParams, useRouter } from 'next/navigation';
import { useStore, getLastSessionSets } from '@/store';
import { useEffect, useState } from 'react';
import type { SessionSet, PlanExercise } from '@/types';
import RestTimer from '@/components/RestTimer';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';

export default function WorkoutPage() {
  const { id } = useParams<{ id: string }>(); // workoutTypeId
  const router = useRouter();
  const store = useStore();
  const { workoutTypes, locations, locationPlans, sessions, activeSession, settings } = store;

  const workoutType = workoutTypes.find((w) => w.id === id);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [restTimer, setRestTimer] = useState<{ seconds: number } | null>(null);
  const [expandedEx, setExpandedEx] = useState<Set<string>>(new Set());

  useEffect(() => {
    const state = useStore.getState();

    if (state.activeSession?.workoutTypeId === id) {
      const locId = state.activeSession.locationId;
      setSelectedLocationId(locId);
      const plan = state.locationPlans.find(
        (p) => p.locationId === locId && p.workoutTypeId === id
      );
      if (plan) setExpandedEx(new Set(plan.exercises.map((e) => e.id)));
      return;
    }

    const firstLocId = state.locations[0]?.id ?? '';
    setSelectedLocationId(firstLocId);
    if (firstLocId) {
      state.startSession(id, firstLocId);
      const plan = state.locationPlans.find(
        (p) => p.locationId === firstLocId && p.workoutTypeId === id
      );
      if (plan) setExpandedEx(new Set(plan.exercises.map((e) => e.id)));
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!workoutType) return <div className="p-4 text-gray-400">אימון לא נמצא</div>;

  const currentPlan = locationPlans.find(
    (p) => p.locationId === selectedLocationId && p.workoutTypeId === id
  );
  const exercises = currentPlan?.exercises ?? [];

  function handleLocationChange(locId: string) {
    setSelectedLocationId(locId);
    const plan = locationPlans.find((p) => p.locationId === locId && p.workoutTypeId === id);
    if (plan) setExpandedEx(new Set(plan.exercises.map((e) => e.id)));
  }

  function getSetsForExercise(exId: string): SessionSet[] {
    if (!activeSession) return [];
    return activeSession.sets.filter((s) => s.exerciseId === exId);
  }

  function getDefaultSet(ex: PlanExercise, setIdx: number) {
    const lastSets = getLastSessionSets(
      sessions.filter((s) => s.endedAt && s.id !== activeSession?.id),
      id,
      ex.id
    );
    const last = lastSets[setIdx];
    const planSet = ex.sets[setIdx] ?? ex.sets[ex.sets.length - 1] ?? { reps: 10, weight: 0, restSeconds: 90 };
    return {
      weight: last?.weight ?? planSet.weight,
      reps: last?.reps ?? planSet.reps,
      restSeconds: planSet.restSeconds,
    };
  }

  function markSetDone(ex: PlanExercise, weight: number, reps: number, rpe: number | null, setIdx: number) {
    if (!activeSession) return;
    store.addSet({ exerciseId: ex.id, exerciseName: ex.name, setNumber: setIdx, weight, reps, rpe });
    const rest = ex.sets[setIdx]?.restSeconds ?? settings.defaultRestSeconds;
    setRestTimer({ seconds: rest });
  }

  function saveNotes(ex: PlanExercise, newNotes: string) {
    if (!currentPlan) return;
    const updated = currentPlan.exercises.map((e) =>
      e.id === ex.id ? { ...e, notes: newNotes } : e
    );
    store.upsertPlan(selectedLocationId, id, updated);
  }

  function finish() {
    store.finishSession();
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between"
        style={{ borderBottom: `2px solid ${workoutType.color}` }}
      >
        <div className="font-bold text-white">
          {workoutType.emoji} {workoutType.name}
        </div>
        <div className="flex gap-2">
          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => handleLocationChange(loc.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedLocationId === loc.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              {loc.name}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise list */}
      <div className="p-4 space-y-4">
        {exercises.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-sm">אין תרגילים במיקום זה</div>
            <div className="text-xs mt-1">הוסף תרגילים בהגדרות → תוכנית</div>
          </div>
        )}

        {exercises.map((ex) => {
          const isExpanded = expandedEx.has(ex.id);
          const doneSets = getSetsForExercise(ex.id);

          return (
            <div key={ex.id} className="bg-gray-900 rounded-xl overflow-hidden">
              <button
                className="w-full p-4 flex items-center justify-between"
                onClick={() =>
                  setExpandedEx((prev) => {
                    const next = new Set(prev);
                    next.has(ex.id) ? next.delete(ex.id) : next.add(ex.id);
                    return next;
                  })
                }
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronUp size={18} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-400" />
                  )}
                  <div className="text-xs text-gray-500">
                    {doneSets.length}/{ex.sets.length}
                  </div>
                </div>
                <div className="font-semibold text-white">{ex.name}</div>
              </button>

              {isExpanded && (
                <>
                  <div className="px-4 pb-2">
                    <textarea
                      key={ex.id + selectedLocationId}
                      defaultValue={ex.notes}
                      onBlur={(e) => saveNotes(ex, e.target.value)}
                      placeholder="הערות לתרגיל..."
                      rows={2}
                      className="w-full bg-gray-800 rounded-lg px-3 py-2 text-gray-300 text-xs border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="px-4 pb-4 space-y-2">
                    <div className="grid grid-cols-12 gap-1 text-xs text-gray-500 text-center mb-1">
                      <div className="col-span-1">סט</div>
                      <div className="col-span-4">ק״ג</div>
                      <div className="col-span-3">חז'</div>
                      <div className="col-span-2">RPE</div>
                      <div className="col-span-2"></div>
                    </div>

                    {Array.from({ length: Math.max(ex.sets.length, doneSets.length) }).map(
                      (_, setIdx) => {
                        const def = getDefaultSet(ex, setIdx);
                        const done = doneSets[setIdx];
                        return (
                          <SetRow
                            key={setIdx}
                            setIdx={setIdx + 1}
                            defaultWeight={def.weight}
                            defaultReps={def.reps}
                            done={!!done}
                            doneData={done}
                            onComplete={(w, r, rpe) => markSetDone(ex, w, r, rpe, setIdx)}
                          />
                        );
                      }
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}

        <button
          onClick={finish}
          className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-base mt-4"
        >
          סיים אימון
        </button>
      </div>

      {restTimer && (
        <RestTimer seconds={restTimer.seconds} onClose={() => setRestTimer(null)} />
      )}
    </div>
  );
}

interface SetRowProps {
  setIdx: number;
  defaultWeight: number;
  defaultReps: number;
  done: boolean;
  doneData?: SessionSet;
  onComplete: (weight: number, reps: number, rpe: number | null) => void;
}

function SetRow({ setIdx, defaultWeight, defaultReps, done, doneData, onComplete }: SetRowProps) {
  const [weight, setWeight] = useState(String(defaultWeight));
  const [reps, setReps] = useState(String(defaultReps));
  const [rpe, setRpe] = useState('');

  function complete() {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps) || 0;
    if (r === 0) return;
    onComplete(w, r, rpe ? parseInt(rpe) : null);
  }

  if (done && doneData) {
    return (
      <div className="grid grid-cols-12 gap-1 items-center text-sm bg-gray-800/50 rounded-lg p-2">
        <div className="col-span-1 text-gray-500 text-center text-xs">{setIdx}</div>
        <div className="col-span-4 text-center text-green-400 font-mono">{doneData.weight}</div>
        <div className="col-span-3 text-center text-green-400 font-mono">{doneData.reps}</div>
        <div className="col-span-2 text-center text-gray-400 text-xs">{doneData.rpe ?? '—'}</div>
        <div className="col-span-2 flex justify-center">
          <Check size={16} className="text-green-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-1 items-center">
      <div className="col-span-1 text-gray-500 text-center text-xs">{setIdx}</div>
      <div className="col-span-4">
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-full bg-gray-800 rounded-lg px-2 py-2 text-white text-center text-sm border border-gray-700 focus:border-blue-500 focus:outline-none font-mono"
          step="0.5"
        />
      </div>
      <div className="col-span-3">
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="w-full bg-gray-800 rounded-lg px-2 py-2 text-white text-center text-sm border border-gray-700 focus:border-blue-500 focus:outline-none font-mono"
        />
      </div>
      <div className="col-span-2">
        <input
          type="number"
          value={rpe}
          onChange={(e) => setRpe(e.target.value)}
          placeholder="—"
          min="1"
          max="10"
          className="w-full bg-gray-800 rounded-lg px-1 py-2 text-white text-center text-xs border border-gray-700 focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div className="col-span-2 flex justify-center">
        <button
          onClick={complete}
          className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center active:bg-blue-700"
        >
          <Check size={14} />
        </button>
      </div>
    </div>
  );
}
