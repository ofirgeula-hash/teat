'use client';
import { useParams, useRouter } from 'next/navigation';
import { useStore, getLastSessionSets } from '@/store';
import { useEffect, useState } from 'react';
import type { SessionSet, PlanExercise, PlanSet, EquipmentType } from '@/types';
import { EQUIPMENT_LABELS } from '@/types';
import RestTimer from '@/components/RestTimer';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

function isUrl(text: string) {
  return text.startsWith('http://') || text.startsWith('https://');
}

export default function WorkoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const store = useStore();
  const { workoutTypes, locations, locationPlans, sessions, activeSession, settings } = store;

  const workoutType = workoutTypes.find((w) => w.id === id);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [restTimer, setRestTimer] = useState<{ seconds: number } | null>(null);
  const [expandedEx, setExpandedEx] = useState<Set<string>>(new Set());
  const [activeEquipment, setActiveEquipment] = useState<Record<string, EquipmentType>>({});

  useEffect(() => {
    const state = useStore.getState();

    if (state.activeSession?.workoutTypeId === id) {
      const locId = state.activeSession.locationId;
      setSelectedLocationId(locId);
      const plan = state.locationPlans.find(
        (p) => p.locationId === locId && p.workoutTypeId === id
      );
      if (plan) {
        setExpandedEx(new Set(plan.exercises.map((e) => e.id)));
        initEquipment(plan.exercises);
      }
      return;
    }

    const firstLocId = state.locations[0]?.id ?? '';
    setSelectedLocationId(firstLocId);
    if (firstLocId) {
      state.startSession(id, firstLocId);
      const plan = state.locationPlans.find(
        (p) => p.locationId === firstLocId && p.workoutTypeId === id
      );
      if (plan) {
        setExpandedEx(new Set(plan.exercises.map((e) => e.id)));
        initEquipment(plan.exercises);
      }
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  function initEquipment(exercises: PlanExercise[]) {
    setActiveEquipment((prev) => {
      const next = { ...prev };
      exercises.forEach((ex) => {
        if ((ex.equipment?.length ?? 0) >= 2 && !next[ex.id]) {
          next[ex.id] = ex.equipment[0];
        }
      });
      return next;
    });
  }

  if (!workoutType) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-gray-400 text-center">אימון לא נמצא</div>
        <button
          onClick={() => { store.cancelSession(); router.push('/'); }}
          className="bg-gray-800 text-white px-6 py-3 rounded-xl text-sm font-medium"
        >
          חזרה לדף הבית
        </button>
      </div>
    );
  }

  const currentPlan = locationPlans.find(
    (p) => p.locationId === selectedLocationId && p.workoutTypeId === id
  );
  const exercises = currentPlan?.exercises ?? [];

  function handleLocationChange(locId: string) {
    setSelectedLocationId(locId);
    const plan = locationPlans.find((p) => p.locationId === locId && p.workoutTypeId === id);
    if (plan) {
      setExpandedEx(new Set(plan.exercises.map((e) => e.id)));
      initEquipment(plan.exercises);
    }
  }

  function getActiveEquipment(ex: PlanExercise): EquipmentType | undefined {
    if (!ex.equipment?.length) return undefined;
    if (ex.equipment.length === 1) return ex.equipment[0];
    return activeEquipment[ex.id] ?? ex.equipment[0];
  }

  function getExNotes(ex: PlanExercise): string[] {
    const eq = getActiveEquipment(ex);
    const hasDual = (ex.equipment?.length ?? 0) >= 2;
    const raw = hasDual && eq && ex.variants?.[eq]
      ? ex.variants[eq]!.notes
      : ex.notes;
    return Array.isArray(raw) ? raw : raw ? [raw as unknown as string] : [];
  }

  function getExSets(ex: PlanExercise): PlanSet[] {
    const eq = getActiveEquipment(ex);
    if ((ex.equipment?.length ?? 0) >= 2 && eq && ex.variants?.[eq]) {
      return ex.variants[eq]!.sets;
    }
    return ex.sets ?? [];
  }

  function getSetsForExercise(exId: string, equipment?: EquipmentType): SessionSet[] {
    if (!activeSession) return [];
    return activeSession.sets.filter(
      (s) => s.exerciseId === exId && (!equipment || s.equipment === equipment)
    );
  }

  function getDefaultSet(ex: PlanExercise, setIdx: number, equipment?: EquipmentType) {
    const lastSets = getLastSessionSets(
      sessions.filter((s) => s.endedAt && s.id !== activeSession?.id),
      id,
      ex.id,
      equipment,
    );
    const last = lastSets[setIdx];
    const planSets = getExSets(ex);
    const planSet = planSets[setIdx] ?? planSets[planSets.length - 1] ?? { reps: 10, weight: 0, restSeconds: 90 };
    return {
      weight: last?.weight ?? planSet.weight,
      reps: last?.reps ?? planSet.reps,
      restSeconds: planSet.restSeconds,
    };
  }

  function handleAutoSave(
    ex: PlanExercise,
    weight: number,
    reps: number,
    rpe: number | null,
    setIdx: number,
    existingSetId: string | undefined,
  ) {
    if (!activeSession) return;
    const equipment = getActiveEquipment(ex);

    if (existingSetId) {
      store.updateSet(existingSetId, { weight, reps, rpe });
    } else {
      store.addSet({ exerciseId: ex.id, exerciseName: ex.name, setNumber: setIdx, weight, reps, rpe, equipment, muscleGroup: ex.muscleGroup });
      const planSets = getExSets(ex);
      const rest = planSets[setIdx]?.restSeconds ?? settings.defaultRestSeconds;
      setRestTimer({ seconds: rest });
    }
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
          const hasDualEquipment = (ex.equipment?.length ?? 0) >= 2;
          const currentEq = getActiveEquipment(ex);
          const doneSets = getSetsForExercise(ex.id, hasDualEquipment ? currentEq : undefined);
          const notes = getExNotes(ex);
          const planSets = getExSets(ex);
          const doneCount = doneSets.filter(Boolean).length;

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
                    {doneCount}/{planSets.length}
                  </div>
                  {ex.equipment?.length === 1 && (
                    <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
                      {EQUIPMENT_LABELS[ex.equipment[0]]}
                    </span>
                  )}
                </div>
                <div className="font-semibold text-white">{ex.name}</div>
              </button>

              {isExpanded && (
                <>
                  {/* Equipment tabs */}
                  {hasDualEquipment && (
                    <div className="px-4 pb-2 flex gap-2 justify-end">
                      {ex.equipment.map((eq) => (
                        <button
                          key={eq}
                          onClick={() => setActiveEquipment((prev) => ({ ...prev, [ex.id]: eq }))}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            currentEq === eq
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {EQUIPMENT_LABELS[eq]}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Notes — read-only */}
                  {notes.length > 0 && (
                    <div className="px-4 pb-2 space-y-1">
                      {notes.map((note, noteIdx) => (
                        <div key={noteIdx} className="flex items-start gap-2">
                          <span className="text-gray-600 text-xs shrink-0 mt-0.5">•</span>
                          {isUrl(note) ? (
                            <a
                              href={note}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-400 text-xs active:text-blue-300 truncate"
                            >
                              <ExternalLink size={10} className="shrink-0" />
                              <span className="truncate">{note}</span>
                            </a>
                          ) : (
                            <span className="text-gray-500 text-xs">{note}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sets */}
                  <div className="px-4 pb-4 space-y-2">
                    <div className="grid grid-cols-12 gap-1 text-xs text-gray-500 text-center mb-1">
                      <div className="col-span-1">סט</div>
                      <div className="col-span-5">ק״ג</div>
                      <div className="col-span-4">חז'</div>
                      <div className="col-span-2">RPE</div>
                    </div>

                    {Array.from({ length: Math.max(planSets.length, doneSets.length) }).map(
                      (_, setIdx) => {
                        const def = getDefaultSet(ex, setIdx, hasDualEquipment ? currentEq : undefined);
                        const done = doneSets[setIdx];
                        return (
                          <SetRow
                            key={`${ex.id}-${currentEq ?? 'none'}-${setIdx}`}
                            setIdx={setIdx + 1}
                            defaultWeight={def.weight}
                            defaultReps={def.reps}
                            savedSet={done}
                            onSave={(w, r, rpe) => handleAutoSave(ex, w, r, rpe, setIdx, done?.id)}
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
  savedSet?: SessionSet;
  onSave: (weight: number, reps: number, rpe: number | null) => void;
}

function SetRow({ setIdx, defaultWeight, defaultReps, savedSet, onSave }: SetRowProps) {
  const [weight, setWeight] = useState(String(savedSet?.weight ?? defaultWeight));
  const [reps, setReps] = useState(String(savedSet?.reps ?? defaultReps));
  const [rpe, setRpe] = useState(savedSet?.rpe != null ? String(savedSet.rpe) : '');

  const isDone = !!savedSet;

  function handleBlur() {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps) || 0;
    if (r > 0) {
      onSave(w, r, rpe ? parseInt(rpe) : null);
    }
  }

  const inputClass = (done: boolean) =>
    `w-full bg-gray-800 rounded-lg px-2 py-2 text-center text-sm border focus:outline-none font-mono ${
      done
        ? 'text-green-400 border-green-900 focus:border-green-600'
        : 'text-white border-gray-700 focus:border-blue-500'
    }`;

  return (
    <div className="grid grid-cols-12 gap-1 items-center">
      <div className={`col-span-1 text-center text-xs font-medium ${isDone ? 'text-green-500' : 'text-gray-500'}`}>
        {setIdx}
      </div>
      <div className="col-span-5">
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={handleBlur}
          className={inputClass(isDone)}
          step="0.5"
        />
      </div>
      <div className="col-span-4">
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onBlur={handleBlur}
          className={inputClass(isDone)}
        />
      </div>
      <div className="col-span-2">
        <input
          type="number"
          value={rpe}
          onChange={(e) => setRpe(e.target.value)}
          onBlur={handleBlur}
          placeholder="—"
          min="1"
          max="10"
          className={`w-full bg-gray-800 rounded-lg px-1 py-2 text-center text-xs border focus:outline-none ${
            isDone ? 'text-gray-500 border-green-900' : 'text-white border-gray-700 focus:border-blue-500'
          }`}
        />
      </div>
    </div>
  );
}
