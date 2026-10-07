'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { Star } from 'lucide-react';
import type { MuscleGroup, EquipmentType } from '@/types';
import { ALL_EQUIPMENT, MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS } from '@/types';

export interface PickableExercise {
  name: string;
  nameHe?: string;
  muscleGroup?: MuscleGroup;
  subMuscle?: string;
  equipment: EquipmentType[];
  gifUrl?: string;
  /** Thumbnail when there's no GIF (bank photo). */
  imageUrl?: string;
}
const ALL_MUSCLE_GROUPS = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[];

export default function ExerciseListPicker<T extends PickableExercise>({
  items,
  title,
  onSelect,
  onClose,
  headerAction,
  renderBadge,
  isUsed,
  showEquipmentFilter,
  mineFilter,
  emptyText = 'לא נמצאו תרגילים',
}: {
  items: T[];
  title: string;
  onSelect: (item: T) => void;
  onClose: () => void;
  headerAction?: { label: string; onClick: () => void };
  renderBadge?: (item: T) => React.ReactNode;
  isUsed?: (item: T) => boolean;
  showEquipmentFilter?: boolean;
  /** Adds a "★ שלי" toggle that narrows the list to the user's saved exercises. */
  mineFilter?: { isMine: (item: T) => boolean; initiallyOn: boolean };
  emptyText?: string;
}) {
  const [search, setSearch] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentType | null>(null);
  const [mineOnly, setMineOnly] = useState(mineFilter?.initiallyOn ?? false);

  const q = search.trim().toLowerCase();
  let filtered = !q
    ? items
    : items.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.nameHe ?? '').toLowerCase().includes(q) ||
          (e.subMuscle ?? '').toLowerCase().includes(q)
      );
  if (equipmentFilter) {
    filtered = filtered.filter((e) => e.equipment.includes(equipmentFilter));
  }
  if (mineFilter && mineOnly) {
    filtered = filtered.filter(mineFilter.isMine);
  }

  const grouped = ALL_MUSCLE_GROUPS.reduce<Record<MuscleGroup, T[]>>((acc, mg) => {
    const list = filtered.filter((e) => e.muscleGroup === mg);
    if (isUsed) list.sort((a, b) => Number(isUsed(a)) - Number(isUsed(b)));
    acc[mg] = list;
    return acc;
  }, {} as Record<MuscleGroup, T[]>);
  const ungrouped = filtered.filter((e) => !e.muscleGroup);

  function renderRow(item: T, idx: number) {
    const used = isUsed?.(item);
    return (
      <button
        key={`${item.name}-${idx}`}
        onClick={() => onSelect(item)}
        className={`w-full text-right bg-surface rounded-xl px-4 py-3 mb-1.5 flex items-center justify-between active:bg-surface-2 ${used ? 'opacity-50' : ''}`}
      >
        <div className="text-right">
          <div className="text-white text-sm font-medium flex items-center gap-2 justify-end">
            {renderBadge?.(item)}
            {item.nameHe || item.name}
          </div>
          {item.nameHe && <div className="text-faint text-xs">{item.name}</div>}
          {item.subMuscle && <div className="text-muted text-xs">{item.subMuscle}</div>}
        </div>
        {item.gifUrl ? (
          <img src={item.gifUrl} alt="" className="w-10 h-10 rounded-lg object-contain bg-white shrink-0 ml-3" />
        ) : item.imageUrl ? (
          <img src={item.imageUrl} alt="" loading="lazy" className="w-12 h-10 rounded-lg object-cover bg-surface-2 shrink-0 ml-3" />
        ) : null}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-line">
        <button onClick={onClose} className="text-muted"><X size={20} /></button>
        <span className="font-semibold text-white text-sm">{title}</span>
        {headerAction ? (
          <button onClick={headerAction.onClick} className="text-accent text-xs">{headerAction.label}</button>
        ) : (
          <span className="w-5" />
        )}
      </div>
      <div className="px-4 py-3 space-y-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חפש תרגיל..."
          autoFocus
          className="w-full bg-surface-2 rounded-xl px-4 py-2.5 text-white text-sm border border-line focus:border-accent focus:outline-none"
        />
        {(showEquipmentFilter || mineFilter) && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {mineFilter && (
              <button
                onClick={() => setMineOnly((v) => !v)}
                aria-pressed={mineOnly}
                className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                  mineOnly ? 'bg-accent text-ink' : 'bg-surface-2 text-muted'
                }`}
              >
                <Star size={11} className={mineOnly ? 'fill-ink' : ''} /> שלי
              </button>
            )}
            {showEquipmentFilter && ALL_EQUIPMENT.map((eq) => (
              <button
                key={eq}
                onClick={() => setEquipmentFilter((prev) => (prev === eq ? null : eq))}
                className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                  equipmentFilter === eq ? 'bg-accent text-ink' : 'bg-surface-2 text-muted'
                }`}
              >
                {EQUIPMENT_LABELS[eq]}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4">
        {ALL_MUSCLE_GROUPS.map((mg) =>
          grouped[mg].length > 0 ? (
            <div key={mg}>
              <div className="text-xs text-muted font-medium mb-1.5">{MUSCLE_GROUP_LABELS[mg]}</div>
              {grouped[mg].map((item, idx) => renderRow(item, idx))}
            </div>
          ) : null
        )}
        {ungrouped.length > 0 && (
          <div>
            <div className="text-xs text-muted font-medium mb-1.5">אחר</div>
            {ungrouped.map((item, idx) => renderRow(item, idx))}
          </div>
        )}
        {filtered.length === 0 && <div className="text-center text-faint py-8 text-sm">{emptyText}</div>}
      </div>
    </div>
  );
}
