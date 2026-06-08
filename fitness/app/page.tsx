'use client';
import { useStore, splitColor } from '@/store';
import { useRouter } from 'next/navigation';
import type { WorkoutTemplate, WorkoutSession } from '@/types';
import { Weight, Flame } from 'lucide-react';
import { useState } from 'react';

function weeklyStats(sessions: WorkoutSession[]) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekSessions = sessions.filter((s) => new Date(s.startedAt) > weekAgo && s.endedAt);
  const volume = weekSessions.flatMap((s) => s.sets).reduce((sum, s) => sum + s.weight * s.reps, 0);
  return { count: weekSessions.length, volume: Math.round(volume) };
}

function streak(sessions: WorkoutSession[]) {
  if (!sessions.length) return 0;
  const days = new Set(sessions.filter((s) => s.endedAt).map((s) => s.startedAt.slice(0, 10)));
  let count = 0;
  const d = new Date();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

const splitEmoji: Record<string, string> = {
  חזה_טריצפס: '💪',
  גב_ביצפס: '🦾',
  כתפיים: '🏔️',
  רגליים: '🦵',
};

export default function HomePage() {
  const { templates, sessions, bodyWeightLogs, activeSession } = useStore();
  const router = useRouter();
  const stats = weeklyStats(sessions);
  const currentStreak = streak(sessions);
  const lastWeight = bodyWeightLogs[0];

  function handleStart(template: WorkoutTemplate) {
    router.push(`/workout/${template.id}`);
  }

  return (
    <div className="p-4 space-y-6">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-white">אימון</h1>
        <p className="text-gray-400 text-sm mt-1">
          {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {activeSession && (
        <button
          onClick={() => router.push(`/workout/${activeSession.templateId}`)}
          className="w-full bg-blue-600 rounded-xl p-4 text-right flex items-center justify-between"
        >
          <div>
            <div className="font-bold">יש אימון פעיל!</div>
            <div className="text-sm text-blue-200">לחץ להמשך</div>
          </div>
          <div className="text-2xl">▶</div>
        </button>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 rounded-xl p-3 text-center">
          <div className="text-blue-400 font-bold text-xl">{stats.count}</div>
          <div className="text-gray-400 text-xs mt-1">השבוע</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-3 text-center">
          <div className="text-green-400 font-bold text-xl flex items-center justify-center gap-1">
            <Flame size={16} />
            {currentStreak}
          </div>
          <div className="text-gray-400 text-xs mt-1">ברצף</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-3 text-center">
          <div className="text-orange-400 font-bold text-xl">
            {lastWeight ? lastWeight.weightKg : '—'}
          </div>
          <div className="text-gray-400 text-xs mt-1">{lastWeight ? 'ק״ג' : 'משקל'}</div>
        </div>
      </div>

      <div>
        <h2 className="text-sm text-gray-400 font-medium mb-3">בחר אימון</h2>
        <div className="grid grid-cols-2 gap-3">
          {templates.map((tpl) => {
            const color = splitColor(tpl.splitName);
            const lastSession = sessions.find((s) => s.templateId === tpl.id && s.endedAt);
            const daysAgo = lastSession
              ? Math.floor((Date.now() - new Date(lastSession.startedAt).getTime()) / 86400000)
              : null;
            return (
              <button
                key={tpl.id}
                onClick={() => handleStart(tpl)}
                className="bg-gray-900 rounded-xl p-4 text-right flex flex-col gap-3 active:scale-95 transition-transform"
                style={{ borderTop: `3px solid ${color}` }}
              >
                <div className="text-3xl">{splitEmoji[tpl.splitName] ?? '🏋️'}</div>
                <div>
                  <div className="font-semibold text-white text-sm leading-tight">{tpl.name}</div>
                  <div className="text-gray-500 text-xs mt-1">{tpl.exercises.length} תרגילים</div>
                </div>
                <div className="text-xs text-gray-600">
                  {daysAgo === null ? 'אף פעם' : daysAgo === 0 ? 'היום' : `לפני ${daysAgo} ימים`}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <BodyWeightQuickAdd />
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
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Weight size={18} className="text-orange-400" />
        <span className="text-sm font-medium">הזן משקל גוף</span>
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder='ק"ג'
          className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
          step="0.1"
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
        <button
          onClick={save}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium active:bg-blue-700"
        >
          {saved ? '✓' : 'שמור'}
        </button>
      </div>
    </div>
  );
}
