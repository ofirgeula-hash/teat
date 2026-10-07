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
              tab === t ? 'bg-accent text-ink' : 'bg-surface-2 text-muted'
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
  const { sessions } = useStore();
  const [selectedEx, setSelectedEx] = useState('');

  const uniqueExNames = [
    ...new Set(
      sessions
        .filter((s) => s.endedAt)
        // Cardio/stretching have no weight to chart.
        .flatMap((s) => s.sets.filter((st) => !st.untracked).map((st) => st.exerciseName))
    ),
  ].filter(Boolean);

  const currentEx = selectedEx || uniqueExNames[0] || '';

  // Sessions are stored newest first; chart the 20 most recent, oldest to newest.
  const data = sessions
    .filter((s) => s.endedAt && s.sets.some((st) => st.exerciseName === currentEx))
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .slice(-20)
    .map((s) => {
      const exSets = s.sets.filter((st) => st.exerciseName === currentEx);
      return {
        date: new Date(s.startedAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }),
        נפח: exSets.reduce((sum, st) => sum + st.weight * st.reps, 0),
        משקל: Math.max(...exSets.map((st) => st.weight)),
      };
    });

  if (!uniqueExNames.length) {
    return <EmptyState message="אין נתונים עדיין. השלם כמה אימונים!" />;
  }

  return (
    <div className="space-y-4">
      <select
        value={currentEx}
        onChange={(e) => setSelectedEx(e.target.value)}
        className="w-full bg-surface-2 border border-line rounded-lg px-3 py-2 text-white text-sm"
      >
        {uniqueExNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <div className="bg-surface rounded-xl p-4">
        <div className="text-sm text-muted mb-3">נפח לאורך זמן (ק״ג × חזרות)</div>
        <div dir="ltr">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
            <XAxis dataKey="date" tick={{ fill: '#a1a1a8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#a1a1a8', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: '#161618', border: '1px solid #2e2e33', borderRadius: 8, color: '#f5f5f5' }}
            />
            <Line type="monotone" dataKey="נפח" stroke="#ff6b1a" strokeWidth={2} dot={{ fill: '#ff6b1a', r: 3 }} />
          </LineChart>
        </ResponsiveContainer></div>
      </div>
      <div className="bg-surface rounded-xl p-4">
        <div className="text-sm text-muted mb-3">המשקל הכבד ביותר בכל אימון (ק״ג)</div>
        <div dir="ltr">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
            <XAxis dataKey="date" tick={{ fill: '#a1a1a8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#a1a1a8', fontSize: 10 }} domain={['dataMin - 5', 'dataMax + 5']} />
            <Tooltip
              contentStyle={{ background: '#161618', border: '1px solid #2e2e33', borderRadius: 8, color: '#f5f5f5' }}
            />
            <Line type="stepAfter" dataKey="משקל" stroke="#f5f5f5" strokeWidth={2} dot={{ fill: '#f5f5f5', r: 3 }} />
          </LineChart>
        </ResponsiveContainer></div>
      </div>
    </div>
  );
}

function BodyWeightChart() {
  const { bodyWeightLogs, addBodyWeight, deleteBodyWeight } = useStore();
  const [val, setVal] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [showHistory, setShowHistory] = useState(false);

  const sorted = [...bodyWeightLogs].sort((a, b) => a.date.localeCompare(b.date));
  const data = sorted.slice(-30).map((l) => ({
    date: new Date(l.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }),
    משקל: l.weightKg,
  }));

  function save() {
    const w = parseFloat(val);
    if (!w || w < 20 || w > 300) return;
    addBodyWeight({ id: crypto.randomUUID(), date, weightKg: w });
    setVal('');
    setDate(new Date().toISOString().slice(0, 10));
  }

  return (
    <div className="space-y-4">
      {data.length > 1 ? (
        <div className="bg-surface rounded-xl p-4">
          <div className="text-sm text-muted mb-3">משקל גוף לאורך זמן</div>
          <div dir="ltr">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
              <XAxis dataKey="date" tick={{ fill: '#a1a1a8', fontSize: 10 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#a1a1a8', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#161618', border: '1px solid #2e2e33', borderRadius: 8, color: '#f5f5f5' }}
              />
              <Line type="monotone" dataKey="משקל" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} />
            </LineChart>
          </ResponsiveContainer></div>
        </div>
      ) : (
        <EmptyState message="הזן לפחות 2 נקודות משקל לצפייה בגרף" />
      )}

      <div className="bg-surface rounded-xl p-4 space-y-3">
        <div className="text-sm text-muted font-medium">הוסף שקילה</div>
        <div className="flex gap-2">
          <input
            type="number"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder='ק"ג'
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="flex-1 bg-surface-2 rounded-lg px-3 py-2 text-white text-sm border border-line focus:border-accent focus:outline-none"
            step="0.1"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-surface-2 rounded-lg px-3 py-2 text-white text-sm border border-line focus:border-accent focus:outline-none"
          />
        </div>
        <button onClick={save} className="w-full bg-accent text-ink py-2 rounded-lg text-sm font-medium">
          הוסף
        </button>
      </div>

      <button
        onClick={() => setShowHistory((v) => !v)}
        className="w-full flex items-center justify-between bg-surface rounded-xl px-4 py-3 text-sm text-muted"
      >
        <span>היסטוריה ({bodyWeightLogs.length})</span>
        <span>{showHistory ? '▲' : '▼'}</span>
      </button>

      {showHistory && (
        <div className="space-y-1">
          {sorted.slice().reverse().map((l) => (
            <div key={l.id} className="flex items-center justify-between bg-surface rounded-lg px-4 py-3 text-sm">
              <button onClick={() => deleteBodyWeight(l.id)} className="text-red-400 text-xs">
                מחק
              </button>
              <div>
                <span className="font-num text-white">{l.weightKg} ק״ג</span>
                <span className="text-muted mr-3">{new Date(l.date).toLocaleDateString('he-IL')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WeeklyVolumeChart() {
  const { sessions, workoutTypes } = useStore();

  const weeks: Record<string, Record<string, number>> = {};
  sessions.filter((s) => s.endedAt).forEach((s) => {
    const d = new Date(s.startedAt);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    const wt = workoutTypes.find((w) => w.id === s.workoutTypeId);
    const wtName = wt?.name ?? 'אחר';
    if (!weeks[key]) weeks[key] = {};
    const vol = s.sets.reduce((sum, st) => sum + st.weight * st.reps, 0);
    weeks[key][wtName] = (weeks[key][wtName] ?? 0) + vol;
  });

  const data = Object.entries(weeks)
    .sort()
    .slice(-8)
    .map(([date, splits]) => ({
      date: new Date(date).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }),
      ...splits,
    }));

  if (!data.length) return <EmptyState message="אין נתונים עדיין" />;

  return (
    <div className="bg-surface rounded-xl p-4">
      <div className="text-sm text-muted mb-3">נפח שבועי לפי סוג אימון</div>
      <div dir="ltr">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
          <XAxis dataKey="date" tick={{ fill: '#a1a1a8', fontSize: 10 }} />
          <YAxis tick={{ fill: '#a1a1a8', fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: '#161618', border: '1px solid #2e2e33', borderRadius: 8, color: '#f5f5f5' }}
          />
          {workoutTypes.map((wt) => (
            <Bar key={wt.id} dataKey={wt.name} stackId="a" fill={wt.color} />
          ))}
        </BarChart>
      </ResponsiveContainer></div>
    </div>
  );
}

function ConsistencyChart() {
  const { sessions } = useStore();

  const trainingDays = new Set(
    sessions.filter((s) => s.endedAt).map((s) => s.startedAt.slice(0, 10))
  );

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
      <div className="bg-surface rounded-xl p-4">
        <div className="text-sm text-muted mb-3">לוח שנה (10 שבועות אחרונים)</div>
        <div className="flex gap-1 mb-1">
          {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day) => (
            <div key={day} className="flex-1 text-center text-xs text-faint">
              {day}
            </div>
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
                        ? 'bg-surface-3 ring-1 ring-blue-400'
                        : 'bg-surface-2'
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-surface rounded-xl p-4 flex items-center justify-between">
        <div className="text-muted text-sm">רצף נוכחי</div>
        <div className="text-2xl font-bold text-good">🔥 {streak} ימים</div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-surface rounded-xl p-8 text-center">
      <div className="text-4xl mb-3">📊</div>
      <div className="text-muted text-sm">{message}</div>
    </div>
  );
}
