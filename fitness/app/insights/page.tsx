'use client';
import { useStore } from '@/store';
import { useState } from 'react';
import type { WorkoutNote } from '@/types';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

export default function InsightsPage() {
  const { workoutNotes, addWorkoutNote, updateWorkoutNote, deleteWorkoutNote } = useStore();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  function handleAdd() {
    if (!newTitle.trim() && !newContent.trim()) return;
    addWorkoutNote({
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      content: newContent.trim(),
      createdAt: new Date().toISOString(),
    });
    setNewTitle('');
    setNewContent('');
    setAdding(false);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">תובנות</h1>
        <button
          onClick={() => setAdding(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
        >
          <Plus size={16} />
          פתק חדש
        </button>
      </div>

      {adding && (
        <div className="bg-gray-900 rounded-xl p-4 space-y-3">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="כותרת..."
            autoFocus
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="מלל חופשי..."
            rows={5}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setAdding(false); setNewTitle(''); setNewContent(''); }}
              className="flex-1 bg-gray-800 text-gray-300 py-2 rounded-lg text-sm"
            >
              ביטול
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium"
            >
              שמור
            </button>
          </div>
        </div>
      )}

      {workoutNotes.length === 0 && !adding && (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">📓</div>
          <div className="text-sm">אין תובנות עדיין</div>
          <div className="text-xs mt-1">לחץ על "פתק חדש" כדי להתחיל</div>
        </div>
      )}

      <div className="space-y-3">
        {workoutNotes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onUpdate={(updates) => updateWorkoutNote(note.id, updates)}
            onDelete={() => deleteWorkoutNote(note.id)}
          />
        ))}
      </div>
    </div>
  );
}

function NoteCard({
  note,
  onUpdate,
  onDelete,
}: {
  note: WorkoutNote;
  onUpdate: (updates: Partial<WorkoutNote>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  function save() {
    onUpdate({ title: title.trim(), content: content.trim() });
    setEditing(false);
  }

  function cancel() {
    setTitle(note.title);
    setContent(note.content);
    setEditing(false);
  }

  const dateStr = new Date(note.createdAt).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (editing) {
    return (
      <div className="bg-gray-900 rounded-xl p-4 space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm border border-blue-500 focus:outline-none"
          autoFocus
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
        />
        <div className="flex gap-2">
          <button onClick={cancel} className="flex-1 bg-gray-800 text-gray-300 py-2 rounded-lg text-sm flex items-center justify-center gap-1">
            <X size={14} /> ביטול
          </button>
          <button onClick={save} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1">
            <Check size={14} /> שמור
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex gap-2">
          <button onClick={() => setEditing(true)} className="text-gray-400">
            <Edit2 size={15} />
          </button>
          <button onClick={onDelete} className="text-red-400">
            <Trash2 size={15} />
          </button>
        </div>
        <div className="text-right">
          {note.title && <div className="font-semibold text-white text-sm">{note.title}</div>}
          <div className="text-xs text-gray-500 mt-0.5">{dateStr}</div>
        </div>
      </div>
      {note.content && (
        <p className="text-gray-300 text-sm whitespace-pre-wrap text-right leading-relaxed">
          {note.content}
        </p>
      )}
    </div>
  );
}
