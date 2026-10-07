'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, Star } from 'lucide-react';
import { useStore } from '@/store';
import type { EquipmentType, MuscleGroup } from '@/types';
import { ALL_EQUIPMENT, EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS } from '@/types';
import {
  CATEGORY_LABELS, saveBankExercise, unsaveBankExercise, useBank,
  type BankExercise,
} from '@/lib/exerciseBank';
import ExerciseImage from '@/components/ExerciseImage';
import { MuscleIcon } from '@/components/BodyMap';

// Groups the bank actually uses (it has no separate rear delts and no catch-all "back").
const FILTER_MUSCLES = (Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[]).filter(
  (m) => m !== 'back' && m !== 'rear_delts' && m !== 'other',
);
const CATEGORIES = Object.keys(CATEGORY_LABELS) as BankExercise['category'][];
const PAGE = 40;

interface Filters {
  search: string;
  muscle: MuscleGroup | null;
  mineOnly: boolean;
  category: BankExercise['category'] | null;
  equipment: EquipmentType | null;
}

// Kept for the session so coming back from an exercise page restores the same view.
let lastFilters: Filters = { search: '', muscle: null, mineOnly: false, category: null, equipment: null };

export default function ExerciseBankPage() {
  const bank = useBank();
  const exerciseLibrary = useStore((s) => s.exerciseLibrary);
  const [filters, setFiltersState] = useState<Filters>(lastFilters);
  const [shown, setShown] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

  function setFilters(update: Partial<Filters>) {
    setFiltersState((f) => (lastFilters = { ...f, ...update }));
    setShown(PAGE);
  }

  const savedIds = useMemo(
    () => new Set(exerciseLibrary.map((e) => e.bankId).filter(Boolean)),
    [exerciseLibrary],
  );

  const results = useMemo(() => {
    if (!bank) return [];
    const q = filters.search.trim().toLowerCase();
    return bank.filter((e) =>
      (!q || e.nameHe.toLowerCase().includes(q) || e.name.toLowerCase().includes(q)) &&
      (!filters.muscle || e.primary.includes(filters.muscle)) &&
      (!filters.mineOnly || savedIds.has(e.id)) &&
      (!filters.category || e.category === filters.category) &&
      (!filters.equipment || e.equipment === filters.equipment),
    );
  }, [bank, filters, savedIds]);

  // Render the grid in pages as the list scrolls; 700 cards with photos at once is too heavy.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setShown((n) => n + PAGE);
    }, { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [results]);

  function toggleSaved(e: BankExercise) {
    if (savedIds.has(e.id)) unsaveBankExercise(e.id);
    else saveBankExercise(e);
  }

  return (
    <div className="pt-4 space-y-3">
      <div className="px-4 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-white">בנק תרגילים</h1>
        {bank && <span className="text-sm text-muted">{results.length} תרגילים</span>}
      </div>

      <div className="px-4">
        <label className="flex items-center gap-2 bg-surface-2 rounded-xl px-3 border border-line focus-within:border-accent">
          <Search size={16} className="text-faint shrink-0" />
          <input
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            placeholder="חיפוש בעברית או באנגלית"
            className="flex-1 bg-transparent py-2.5 text-white text-base focus:outline-none"
          />
        </label>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4" role="group" aria-label="קבוצת שריר">
        <MuscleChip label="הכל" group={null} active={!filters.muscle} onClick={() => setFilters({ muscle: null })} />
        {FILTER_MUSCLES.map((m) => (
          <MuscleChip
            key={m}
            label={MUSCLE_GROUP_LABELS[m]}
            group={m}
            active={filters.muscle === m}
            onClick={() => setFilters({ muscle: filters.muscle === m ? null : m })}
          />
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-4">
        <Pill active={filters.mineOnly} onClick={() => setFilters({ mineOnly: !filters.mineOnly })}>
          <Star size={12} className={filters.mineOnly ? 'fill-ink' : ''} /> שלי ({savedIds.size})
        </Pill>
        {CATEGORIES.map((c) => (
          <Pill key={c} active={filters.category === c} onClick={() => setFilters({ category: filters.category === c ? null : c })}>
            {CATEGORY_LABELS[c]}
          </Pill>
        ))}
      </div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-4">
        {ALL_EQUIPMENT.filter((eq) => eq !== 'plates').map((eq) => (
          <Pill key={eq} active={filters.equipment === eq} onClick={() => setFilters({ equipment: filters.equipment === eq ? null : eq })}>
            {EQUIPMENT_LABELS[eq]}
          </Pill>
        ))}
      </div>

      {!bank ? (
        <div className="text-center text-faint py-16 text-sm">טוען את הבנק…</div>
      ) : results.length === 0 ? (
        <div className="text-center text-faint py-16 text-sm px-4">
          {filters.mineOnly && savedIds.size === 0 ? 'עוד לא שמרת תרגילים. לחץ על ★ בתרגיל כדי לשמור אותו.' : 'לא נמצאו תרגילים'}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 px-4 pb-4">
          {results.slice(0, shown).map((e) => (
            <ExerciseCard key={e.id} exercise={e} saved={savedIds.has(e.id)} onToggleSaved={() => toggleSaved(e)} />
          ))}
        </div>
      )}
      {bank && shown < results.length && <div ref={sentinel} className="h-px" />}
    </div>
  );
}

function ExerciseCard({ exercise: e, saved, onToggleSaved }: {
  exercise: BankExercise;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  return (
    <div className="relative bg-surface rounded-2xl overflow-hidden border border-line">
      <Link href={`/exercises/${encodeURIComponent(e.id)}`} className="block active:opacity-80">
        <ExerciseImage bankId={e.id} alt="" className="aspect-[5/4]" />
        <div className="px-3 pt-2 pb-3 text-right">
          <div className="text-sm font-semibold text-white leading-snug line-clamp-2">{e.nameHe}</div>
          <div className="text-xs text-muted mt-0.5 truncate">
            {MUSCLE_GROUP_LABELS[e.primary[0]]} · {EQUIPMENT_LABELS[e.equipment]}
          </div>
        </div>
      </Link>
      <button
        onClick={onToggleSaved}
        aria-label={saved ? `הסר את ${e.nameHe} מהשמורים` : `שמור את ${e.nameHe}`}
        aria-pressed={saved}
        className={`absolute top-2 right-2 w-9 h-9 rounded-xl flex items-center justify-center ${saved ? 'bg-accent text-ink' : 'bg-black/55 text-white'}`}
      >
        <Star size={16} className={saved ? 'fill-ink' : ''} />
      </button>
    </div>
  );
}

function MuscleChip({ label, group, active, onClick }: {
  label: string;
  group: MuscleGroup | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 w-[68px] flex flex-col items-center gap-1 pt-2 pb-1.5 rounded-2xl border ${
        active ? 'border-accent bg-accent/10' : 'border-line bg-surface'
      }`}
    >
      <MuscleIcon group={group} />
      <span className={`text-[11px] leading-tight ${active ? 'text-white' : 'text-muted'}`}>{label}</span>
    </button>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${
        active ? 'bg-accent text-ink' : 'bg-surface-2 text-muted'
      }`}
    >
      {children}
    </button>
  );
}
