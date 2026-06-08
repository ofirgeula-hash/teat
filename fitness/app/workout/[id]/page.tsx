'use client';
import { useParams, useRouter } from 'next/navigation';
import { useStore, getLastSessionSets, splitColor } from '@/store';
import { useEffect, useState, useRef } from 'react';
import type { SessionSet, TemplateExercise } from '@/types';
import RestTimer from '@/components/RestTimer';
import { ChevronDown, ChevronUp, Plus, X, Check, ArrowRight } from 'lucide-react';

export default function WorkoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const store = useStore();
  const { templates, exercises, locations, sessions, activeSession, settings } = store;

  const template = templates.find((t) => t.id === id);
  const [locationId, setLocationId] = useState<string>('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [restTimer, setRestTimer] = useState<{ seconds: number } | null>(null);
  const [expandedEx, setExpandedEx] = useState<Set<string>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  // Start or resume session
  useEffect(() => {
    if (!template) return;
    if (activeSession?.templateId === id) {
      // Resume existing session
      if (!locationId && activeSession.locationId) setLocationId(activeSession.locationId);
      return;
    }
    // Not started yet - show location picker
    if (locations.length > 0) {
      setLocationId(locations[0].id);
      setShowLocationPicker(true);
    }
  }, [template, id]);

  // Elapsed timer
  useEffect(() => {
    const interval = setInterval(() => {
      const base = activeSession ? new Date(activeSession.startedAt).getTime() : startRef.current;
      setElapsed(Math.floor((Date.now() - base) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  if (!template) return <div className="p-4 text-gray-400">אימון לא נמצא</div>;

  const location = locations.find((l) => l.id === locationId);

  function startSession() {
    if (!locationId) return;
    store.startSession(id, locationId);
    setShowLocationPicker(false);
    setExpandedEx(new Set(template!.exercises.map((e) => e.exerciseId)));
  }

  function getMissingEquipment(exId: string) {
    const ex = exercises.find((e) => e.id === exId);
    if (!ex || !location) return false;
    return ex.requiredEquipment.some((eq) => !location.availableEquipment.includes(eq));
  }

  function getAlternatives(exId: string) {
    const ex = exercises.find((e) => e.id === exId);
    if (!ex) return [];
    return ex.alternativeIds.map((aid) => exercises.find((e) => e.id === aid)).filter(Boolean);
  }

  function getSetsForExercise(exId: string): SessionSet[] {
    if (!activeSession) return [];
    return activeSession.sets.filter((s) => s.exerciseId === exId);
  }

  function getLastSets(exId: string) {
    return getLastSessionSets(sessions.filter((s) => s.endedAt && s.id !== activeSession?.id), id, exId);
  }

  function getDefaultSet(tplEx: TemplateExercise, setIdx: number) {
    const lastSets = getLastSets(tplEx.exerciseId);
    const last = lastSets[setIdx];
    const tplSet = tplEx.sets[setIdx] ?? tplEx.sets[tplEx.sets.length - 1];
    return {
      weight: last?.weight ?? tplSet.weight,
      reps: last?.reps ?? tplSet.reps,
      restSeconds: tplSet.restSeconds,
    };
  }

  function markSetDone(exId: string, weight: number, reps: number, rpe: number | null, setIdx: number) {
    if (!activeSession) return;
    store.addSet({ exerciseId: exId, setNumber: setIdx, weight, reps, rpe, notes: '' });
    const tplEx = template!.exercises.find((e) => e.exerciseId === exId);
    const rest = tplEx?.sets[setIdx]?.restSeconds ?? settings.defaultRestSeconds;
    setRestTimer({ seconds: rest });
  }

  function finish() {
    store.finishSession();
    router.push('/history');
  }

  function cancel() {
    store.cancelSession();
    router.back();
  }

  const fmtElapsed = () => {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between"
        style={{ borderBottom: `2px solid ${splitColor(template.splitName)}` }}
      >
        <button onClick={cancel} className="text-gray-400 p-1">
          <X size={20} />
        </button>
        <div className="text-center">
          <div className="font-bold text-white">{template.name}</div>
          <div className="text-xs text-gray-400">{fmtElapsed()}</div>
        </div>
        <button onClick={finish} className="bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg font-medium">
          סיים
        </button>
      </div>

      {/* Location picker modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 bg-black/80 flex items-end z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full space-y-4">
            <h3 className="font-bold text-white text-lg">איפה מתאמן?</h3>
            {locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => setLocationId(loc.id)}
                className={`w-full text-right p-4 rounded-xl border transition-colors ${
                  locationId === loc.id
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-gray-700 bg-gray-800'
                }`}
              >
                {loc.name}
              </button>
            ))}
            <button
              onClick={startSession}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-base"
            >
              התחל אימון
            </button>
          </div>
        </div>
      )}

      {/* Exercise list */}
      <div className="p-4 space-y-4">
        {template.exercises.map((tplEx, exIdx) => {
          const ex = exercises.find((e) => e.id === tplEx.exerciseId);
          if (!ex) return null;
          const isExpanded = expandedEx.has(ex.id);
          const doneSets = getSetsForExercise(ex.id);
          const missing = getMissingEquipment(ex.id);
          const alts = getAlternatives(ex.id);

          return (
            <div key={ex.id} className="bg-gray-900 rounded-xl overflow-hidden">
              {/* Exercise header */}
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
                  {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  <div className="text-xs text-gray-500">{doneSets.length}/{tplEx.sets.length}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-white">{ex.name}</div>
                  <div className="text-xs text-gray-500">{ex.muscleGroup.replace('_', ' ')}</div>
                  {missing && (
                    <div className="text-xs text-yellow-400 mt-0.5">⚠ ציוד חסר במיקום זה</div>
                  )}
                </div>
              </button>

              {missing && isExpanded && alts.length > 0 && (
                <div className="px-4 pb-2">
                  <div className="text-xs text-gray-400 mb-2">חלופות זמינות:</div>
                  <div className="flex gap-2 flex-wrap">
                    {alts.map((alt) => alt && (
                      <span key={alt.id} className="bg-gray-800 text-xs text-yellow-300 px-2 py-1 rounded-lg">
                        {alt.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {isExpanded && ex.notes.length > 0 && (
                <div className="px-4 pb-2">
                  {ex.notes.map((n, i) => (
                    <div key={i} className="text-xs text-gray-500 italic">• {n}</div>
                  ))}
                </div>
              )}

              {/* Sets */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {/* Header row */}
                  <div className="grid grid-cols-12 gap-1 text-xs text-gray-500 text-center mb-1">
                    <div className="col-span-1">סט</div>
                    <div className="col-span-4">ק״ג</div>
                    <div className="col-span-3">חז'</div>
                    <div className="col-span-2">RPE</div>
                    <div className="col-span-2"></div>
                  </div>

                  {Array.from({ length: Math.max(tplEx.sets.length, doneSets.length) }).map((_, setIdx) => {
                    const def = getDefaultSet(tplEx, setIdx);
                    const done = doneSets[setIdx];
                    return (
                      <SetRow
                        key={setIdx}
                        setIdx={setIdx + 1}
                        defaultWeight={def.weight}
                        defaultReps={def.reps}
                        done={!!done}
                        doneData={done}
                        onComplete={(w, r, rpe) => markSetDone(ex.id, w, r, rpe, setIdx)}
                        disabled={!activeSession}
                      />
                    );
                  })}
                </div>
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
  disabled: boolean;
}

function SetRow({ setIdx, defaultWeight, defaultReps, done, doneData, onComplete, disabled }: SetRowProps) {
  const [weight, setWeight] = useState(String(defaultWeight));
  const [reps, setReps] = useState(String(defaultReps));
  const [rpe, setRpe] = useState('');

  function complete() {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps) || 0;
    const rpeVal = rpe ? parseInt(rpe) : null;
    if (r === 0) return;
    onComplete(w, r, rpeVal);
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
          disabled={disabled}
          step="0.5"
        />
      </div>
      <div className="col-span-3">
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="w-full bg-gray-800 rounded-lg px-2 py-2 text-white text-center text-sm border border-gray-700 focus:border-blue-500 focus:outline-none font-mono"
          disabled={disabled}
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
          disabled={disabled}
        />
      </div>
      <div className="col-span-2 flex justify-center">
        <button
          onClick={complete}
          disabled={disabled}
          className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center disabled:opacity-30 active:bg-blue-700"
        >
          <Check size={14} />
        </button>
      </div>
    </div>
  );
}
