'use client';
import { useStore, splitColor } from '@/store';
import type { WorkoutSession, Exercise } from '@/types';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function HistoryPage() {
  const { sessions, templates, exercises, locations } = useStore();
  const completed = sessions.filter((s) => s.endedAt);

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-white">היסטוריה</h1>
        <p className="text-gray-400 text-sm mt-1">{completed.length} אימונים מוקלטים</p>
      </div>

      {completed.length === 0 && (
        <div className="text-gray-500 text-center py-16">
          <div className="text-4xl mb-3">📋</div>
          <div>עדיין אין אימונים</div>
        </div>
      )}

      {completed.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          templateName={templates.find((t) => t.id === session.templateId)?.name ?? 'אימון'}
          splitName={templates.find((t) => t.id === session.templateId)?.splitName ?? 'כתפיים'}
          locationName={locations.find((l) => l.id === session.locationId)?.name ?? ''}
          exercises={exercises}
        />
      ))}
    </div>
  );
}

function SessionCard({
  session,
  templateName,
  splitName,
  locationName,
  exercises,
}: {
  session: WorkoutSession;
  templateName: string;
  splitName: string;
  locationName: string;
  exercises: Exercise[];
}) {
  const [expanded, setExpanded] = useState(false);
  const color = splitColor(splitName as any);
  const startDate = new Date(session.startedAt);
  const endDate = session.endedAt ? new Date(session.endedAt) : null;
  const durationMin = endDate ? Math.round((endDate.getTime() - startDate.getTime()) / 60000) : null;
  const totalVolume = session.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);

  const uniqueExercises = [...new Set(session.sets.map((s) => s.exerciseId))];

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      <button
        className="w-full p-4 flex items-center justify-between"
        onClick={() => setExpanded((e) => !e)}
        style={{ borderRight: `3px solid ${color}` }}
      >
        <div className="flex items-center gap-2 text-gray-400">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        <div className="text-right flex-1 mr-2">
          <div className="font-semibold text-white">{templateName}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {startDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
            {locationName && ` · ${locationName}`}
          </div>
        </div>
      </button>

      {/* Summary row */}
      <div className="px-4 pb-3 flex gap-4 text-xs text-gray-400 border-t border-gray-800 pt-3">
        {durationMin && <span>⏱ {durationMin} דק'</span>}
        <span>📦 {Math.round(totalVolume).toLocaleString('he')} ק״ג נפח</span>
        <span>💪 {uniqueExercises.length} תרגילים</span>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-800">
          {uniqueExercises.map((exId) => {
            const ex = exercises.find((e) => e.id === exId);
            const sets = session.sets.filter((s) => s.exerciseId === exId);
            return (
              <div key={exId}>
                <div className="text-sm font-medium text-white mb-1">{ex?.name ?? exId}</div>
                <div className="space-y-1">
                  {sets.map((s, i) => (
                    <div key={s.id} className="flex justify-between text-xs text-gray-400">
                      <span>סט {i + 1}</span>
                      <span className="font-mono">
                        {s.weight > 0 ? `${s.weight} ק״ג` : 'משקל גוף'} × {s.reps}
                        {s.rpe ? ` @ RPE ${s.rpe}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
