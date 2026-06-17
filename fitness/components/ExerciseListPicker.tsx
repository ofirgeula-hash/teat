'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import type { MuscleGroup, EquipmentType } from '@/types';
import { MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS } from '@/types';

export interface PickableExercise {
  name: string;
  nameHe?: string;
  muscleGroup?: MuscleGroup;
  subMuscle?: string;
  equipment: EquipmentType[];
  gifUrl?: string;
}

const ALL_EQUIPMENT: EquipmentType[] = ['machine', 'dumbbells', 'plates'];
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
  emptyText?: string;
}) {
  const [search, setSearch] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentType | null>(null);

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
        className={`w-full text-right bg-gray-900 rounded-xl px-4 py-3 mb-1.5 flex items-center justify-between active:bg-gray-800 ${used ? 'opacity-50' : ''}`}
      >
        <div className="text-right">
          <div className="text-white text-sm font-medium flex items-center gap-2 justify-end">
            {renderBadge?.(item)}
            {item.nameHe || item.name}
          </div>
          {item.nameHe && <div className="text-gray-600 text-xs">{item.name}</div>}
          {item.subMuscle && <div className="text-gray-500 text-xs">{item.subMuscle}</div>}
        </div>
        {item.gifUrl && (
          <img src={item.gifUrl} alt="" className="w-10 h-10 rounded-lg object-contain bg-white shrink-0 ml-3" />
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-gray-950/90 safe-top flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button onClick={onClose} className="text-gray-400"><X size={20} /></button>
        <span className="font-semibold text-white text-sm">{title}</span>
        {headerAction ? (
          <button onClick={headerAction.onClick} className="text-blue-400 text-xs">{headerAction.label}</button>
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
          className="w-full bg-gray-800 rounded-xl px-4 py-2.5 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
        />
        {showEquipmentFilter && (
          <div className="flex gap-1.5 justify-end">
            {ALL_EQUIPMENT.map((eq) => (
              <button
                key={eq}
                onClick={() => setEquipmentFilter((prev) => (prev === eq ? null : eq))}
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  equipmentFilter === eq ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                {EQUIPMENT_LABELS[eq]}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4 safe-bottom">
        {ALL_MUSCLE_GROUPS.map((mg) =>
          grouped[mg].length > 0 ? (
            <div key={mg}>
              <div className="text-xs text-gray-500 font-medium mb-1.5">{MUSCLE_GROUP_LABELS[mg]}</div>
              {grouped[mg].map((item, idx) => renderRow(item, idx))}
            </div>
          ) : null
        )}
        {ungrouped.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 font-medium mb-1.5">אחר</div>
            {ungrouped.map((item, idx) => renderRow(item, idx))}
          </div>
        )}
        {filtered.length === 0 && <div className="text-center text-gray-600 py-8 text-sm">{emptyText}</div>}
      </div>
    </div>
  );
}
