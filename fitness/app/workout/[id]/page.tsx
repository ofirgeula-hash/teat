'use client';
import { useParams, useRouter } from 'next/navigation';
import { useStore, getLastSessionSets } from '@/store';
import { useEffect, useRef, useState } from 'react';
import type { SessionSet, PlanExercise, PlanSet, EquipmentType } from '@/types';
import { EQUIPMENT_LABELS } from '@/types';
import RestTimer from '@/components/RestTimer';
import { ChevronDown, ChevronUp, Check, Plus, X, ExternalLink } from 'lucide-react';

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
  const [localNotes, setLocalNotes] = useState<Record<string, string[]>>({});
  const [activeEquipment, setActiveEquipment] = useState<Record<string, EquipmentType>>({});
  const newNoteRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
        if (ex.equipment?.length >= 2 && !next[ex.id]) {
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
    setLocalNotes({});
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
    const base = ex.equipment?.length >= 2 && eq && ex.variants?.[eq]
      ? ex.variants[eq]!.notes
      : (localNotes[ex.id] ?? ex.notes);
    return Array.isArray(base) ? base : base ? [base as unknown as string] : [];
  }

  function getExSets(ex: PlanExercise): PlanSet[] {
    const eq = getActiveEquipment(ex);
    if (ex.equipment?.length >= 2 && eq && ex.variants?.[eq]) {
      return ex.variants[eq]!.sets;
    }
    return ex.sets ?? [];
  }

  function updateNote(ex: PlanExercise, noteIdx: number, val: string) {
    const current = localNotes[ex.id] ?? ex.notes;
    const updated = [...current];
    updated[noteIdx] = val;
    setLocalNotes((prev) => ({ ...prev, [ex.id]: updated }));
  }

  function addNote(ex: PlanExercise) {
    const current = localNotes[ex.id] ?? ex.notes;
    const updated = [...current, ''];
    setLocalNotes((prev) => ({ ...prev, [ex.id]: updated }));
    setTimeout(() => newNoteRefs.current[ex.id]?.focus(), 30);
  }

  function deleteNote(ex: PlanExercise, noteIdx: number) {
    const current = localNotes[ex.id] ?? ex.notes;
    const updated = current.filter((_, i) => i !== noteIdx);
    setLocalNotes((prev) => ({ ...prev, [ex.id]: updated }));
    saveExNotes(ex, updated);
  }

  function saveExNotes(ex: PlanExercise, notes?: string[]) {
    if (!currentPlan || ex.equipment?.length >= 2) return;
    const toSave = (notes ?? localNotes[ex.id] ?? ex.notes).filter((n) => n.trim());
    const updated = currentPlan.exercises.map((e) =>
      e.id === ex.id ? { ...e, notes: toSave } : e
    );
    store.upsertPlan(selectedLocationId, id, updated);
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

  function markSetDone(ex: PlanExercise, weight: number, reps: number, rpe: number | null, setIdx: number) {
    if (!activeSession) return;
    const equipment = getActiveEquipment(ex);
    store.addSet({ exerciseId: ex.id, exerciseName: ex.name, setNumber: setIdx, weight, reps, rpe, equipment });
    const planSets = getExSets(ex);
    const rest = planSets[setIdx]?.restSeconds ?? settings.defaultRestSeconds;
    setRestTimer({ seconds: rest });
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
                    {doneSets.length}/{planSets.length}
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
                  {/* Equipment tabs for dual-equipment exercises */}
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

                  {/* Notes — only shown for single/no equipment */}
                  {!hasDualEquipment && (
                    <div className="px-4 pb-2 space-y-1">
                      {notes.map((note, noteIdx) => (
                        <div key={noteIdx} className="flex items-center gap-2">
                          <span className="text-gray-600 text-xs shrink-0">•</span>
                          {isUrl(note) ? (
                            <a
                              href={note}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center gap-1 text-blue-400 text-xs active:text-blue-300 truncate"
                            >
                              <ExternalLink size={10} className="shrink-0" />
                              <span className="truncate">{note}</span>
                            </a>
                          ) : (
                            <input
                              value={note}
                              onChange={(e) => updateNote(ex, noteIdx, e.target.value)}
                              onBlur={() => saveExNotes(ex)}
                              placeholder="הערה..."
                              ref={noteIdx === notes.length - 1
                                ? (el) => { newNoteRefs.current[ex.id] = el; }
                                : undefined}
                              className="flex-1 bg-transparent text-gray-400 text-xs focus:outline-none focus:text-gray-200 placeholder-gray-700"
                            />
                          )}
                          <button
                            onClick={() => deleteNote(ex, noteIdx)}
                            className="text-gray-700 active:text-red-400 shrink-0"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addNote(ex)}
                        className="flex items-center gap-1 text-gray-700 text-xs mt-0.5 active:text-gray-400"
                      >
                        <Plus size={10} />
                        <span>הוסף הערה</span>
                      </button>
                    </div>
                  )}

                  {/* Notes for dual equipment — read-only from plan */}
                  {hasDualEquipment && notes.length > 0 && (
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
                      <div className="col-span-4">ק״ג</div>
                      <div className="col-span-3">חז'</div>
                      <div className="col-span-2">RPE</div>
                      <div className="col-span-2"></div>
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
