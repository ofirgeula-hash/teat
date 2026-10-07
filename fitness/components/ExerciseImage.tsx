'use client';
import { useState } from 'react';
import { Dumbbell, Pause, Play } from 'lucide-react';
import { bankImage } from '@/lib/exerciseBank';

/**
 * The bank's two photos of an exercise. `animate` alternates them (start ↔ end position)
 * with a pause button; otherwise only the start position is shown.
 */
export default function ExerciseImage({ bankId, alt, animate = false, className = '' }: {
  bankId: string;
  alt: string;
  animate?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-surface-2 ${className}`}>
      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center text-faint">
          <Dumbbell size={28} />
        </div>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- remote photos, no Next image optimisation */}
          <img
            src={bankImage(bankId, 0)}
            alt={alt}
            loading="lazy"
            onError={() => setFailed(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {animate && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bankImage(bankId, 1)}
              alt=""
              loading="lazy"
              className="frame-flip absolute inset-0 w-full h-full object-cover"
              style={{ animationPlayState: paused ? 'paused' : 'running' }}
            />
          )}
        </>
      )}
      {animate && !failed && (
        <button
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'הפעל' : 'עצור'}
          className="absolute top-2.5 left-2.5 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center motion-reduce:hidden"
        >
          {paused ? <Play size={15} /> : <Pause size={15} />}
        </button>
      )}
    </div>
  );
}
