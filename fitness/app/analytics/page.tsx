'use client';
import { useStore } from '@/store';
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import type { SplitName } from '@/types';

type Tab = 'נפח' | 'משקל_גוף' | 'שבועי' | 'עקביות';

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>('נפח');

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-white">גרפים</h1>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['נפח', 'משקל_גוף', 'שבועי', 'עקביות'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {t === 'משקל_גוף' ? 'משקל גוף' : t}
          </button>
        ))}
      </div>

      {tab === 'נפח' && <VolumeChart />}
      {tab === 'משקל_גוף' && <BodyWeightChart />}
      {tab === 'שבועי' && <WeeklyVolumeChart />}
      {tab === 'עקביות' && <ConsistencyChart />}
    </div>
  );
}

function VolumeChart() {
  const { sessions, exercises, templates } = useStore();
  const [selectedEx, setSelectedEx] = useState<string>('');

  const uniqueExIds = [...new Set(sessions.flatMap((s) => s.sets.map((st) => st.exerciseId)))];
  const exOptions = uniqueExIds.map((id) => exercises.find((e) => e.id === id)).filter(Boolean);

  const currentExId = selectedEx || uniqueExIds[0] || '';
  const data = sessions
    .filter((s) => s.endedAt && s.sets.some((st) => st.exerciseId === currentExId))
    .map((s) => ({
      date: new Date(s.startedAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }),
      נפח: s.sets.filter((st) => st.exerciseId === currentExId).reduce((sum, st) => sum + st.weight * st.reps, 0),
    }))
    .slice(-20);

  if (!exOptions.length) {
    return <EmptyState message="אין נתונים עדיין. השלם כמה אימונים!" />;
  }

  return (
    <div className="space-y-4">
      <select
        value={currentExId}
        onChange={(e) => setSelectedEx(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
      >
        {exOptions.map((ex) => ex && (
          <option key={ex.id} value={ex.id}>{ex.name}</option>
        ))}
      </select>
      <div className="bg-gray-900 rounded-xl p-4">
        <div className="text-sm text-gray-400 mb-3">נפח לאורך זמן (ק״ג × חזרות)</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }}
            />
            <Line type="monotone" dataKey="נפח" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BodyWeightChart() {
  const { bodyWeightLogs, addBodyWeight, deleteBodyWeight } = useStore();
  const [val, setVal] = useState('');

  const data = [...bodyWeightLogs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)
    .map((l) => ({
      date: new Date(l.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }),
      משקל: l.weightKg,
    }));

  function save() {
    const w = parseFloat(val);
    if (!w || w < 20 || w > 300) return;
    addBodyWeight({ id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), weightKg: w });
    setVal('');
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder='ק"ג'
          className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
          step="0.1"
        />
        <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          הוסף
        </button>
      </div>
      {data.length > 1 ? (
        <div className="bg-gray-900 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-3">משקל גוף לאורך זמן</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }}
              />
              <Line type="monotone" dataKey="משקל" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState message="הזן לפחות 2 נקודות משקל לצפייה בגרף" />
      )}
      {bodyWeightLogs.slice(0, 5).map((l) => (
        <div key={l.id} className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3 text-sm">
          <button onClick={() => deleteBodyWeight(l.id)} className="text-red-400 text-xs">מחק</button>
          <div>
            <span className="font-mono text-white">{l.weightKg} ק״ג</span>
            <span className="text-gray-400 mr-3">{new Date(l.date).toLocaleDateString('he-IL')}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function WeeklyVolumeChart() {
  const { sessions, templates } = useStore();

  const weeks: Record<string, Record<string, number>> = {};
  sessions.filter((s) => s.endedAt).forEach((s) => {
    const d = new Date(s.startedAt);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    const tpl = templates.find((t) => t.id === s.templateId);
    const split = tpl?.splitName ?? 'אחר';
    if (!weeks[key]) weeks[key] = {};
    const vol = s.sets.reduce((sum, st) => sum + st.weight * st.reps, 0);
    weeks[key][split] = (weeks[key][split] ?? 0) + vol;
  });

  const data = Object.entries(weeks)
    .sort()
    .slice(-8)
    .map(([date, splits]) => ({
      date: new Date(date).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }),
      ...splits,
    }));

  const splitColors: Record<SplitName, string> = {
    חזה_טריצפס: '#3b82f6',
    גב_ביצפס: '#10b981',
    כתפיים: '#f59e0b',
    רגליים: '#ef4444',
  };

  if (!data.length) return <EmptyState message="אין נתונים עדיין" />;

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="text-sm text-gray-400 mb-3">נפח שבועי לפי split</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }}
          />
          {(Object.keys(splitColors) as SplitName[]).map((split) => (
            <Bar key={split} dataKey={split} stackId="a" fill={splitColors[split]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ConsistencyChart() {
  const { sessions } = useStore();

  const trainingDays = new Set(
    sessions.filter((s) => s.endedAt).map((s) => s.startedAt.slice(0, 10))
  );

  // Last 10 weeks
  const weeks = Array.from({ length: 10 }, (_, i) => {
    const start = new Date();
    start.setDate(start.getDate() - (9 - i) * 7 - start.getDay());
    return Array.from({ length: 7 }, (_, d) => {
      const day = new Date(start);
      day.setDate(start.getDate() + d);
      return day.toISOString().slice(0, 10);
    });
  });

  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  const d = new Date();
  while (trainingDays.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-xl p-4">
        <div className="text-sm text-gray-400 mb-3">לוח שנה (10 שבועות אחרונים)</div>
        <div className="flex gap-1 mb-1">
          {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((d) => (
            <div key={d} className="flex-1 text-center text-xs text-gray-600">{d}</div>
          ))}
        </div>
        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex gap-1">
              {week.map((day) => {
                const isTrained = trainingDays.has(day);
                const isToday = day === today;
                return (
                  <div
                    key={day}
                    className={`flex-1 aspect-square rounded-sm ${
                      isTrained
                        ? 'bg-blue-500'
                        : isToday
                        ? 'bg-gray-700 ring-1 ring-blue-400'
                        : 'bg-gray-800'
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-900 rounded-xl p-4 flex items-center justify-between">
        <div className="text-gray-400 text-sm">רצף נוכחי</div>
        <div className="text-2xl font-bold text-green-400">🔥 {streak} ימים</div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-gray-900 rounded-xl p-8 text-center">
      <div className="text-4xl mb-3">📊</div>
      <div className="text-gray-400 text-sm">{message}</div>
    </div>
  );
}
