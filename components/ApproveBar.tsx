// components/ApproveBar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import type { ApproveState } from './Demo';

interface Props {
  state: ApproveState;
  onApprove: () => void;
  expectedMs?: number;
}

const TICK_MS = 80;
const FILL_TARGET = 75; // reaches 75% at expectedMs, then crawls

export function ApproveBar({ state, onApprove, expectedMs = 8000 }: Props) {
  const [barW, setBarW] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.kind === 'loading') {
      startTimeRef.current = Date.now();
      setBarW(0);

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - (startTimeRef.current ?? Date.now());
        const progress = elapsed / expectedMs;

        if (progress < 1) {
          // Linear up to FILL_TARGET%
          setBarW(progress * FILL_TARGET);
        } else {
          // Past expected time: crawl slowly from FILL_TARGET toward 97%
          const overage = progress - 1;
          const extra = (1 - Math.exp(-overage * 0.6)) * (97 - FILL_TARGET);
          setBarW(FILL_TARGET + extra);
        }
      }, TICK_MS);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (state.kind === 'done') {
        setBarW(100);
      } else if (state.kind === 'idle' || state.kind === 'error') {
        setBarW(0);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.kind, expectedMs]);

  const showBar = state.kind === 'loading' || state.kind === 'done';
  const transition = state.kind === 'done' ? 'width 0.3s ease-out' : 'none';

  if (state.kind === 'done') {
    return (
      <div>
        <div className="w-full h-[3px] bg-border/40 relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-accent"
            style={{ width: `${barW}%`, transition }}
          />
        </div>
        <div className="flex items-center justify-end gap-4 px-4 py-4">
          <a
            href={state.pulseUrl}
            download="pulse_filled.pdf"
            className="font-mono text-xs px-4 py-2 min-h-[44px] bg-accent text-bg rounded inline-flex items-center hover:bg-accent/90 transition-colors"
          >
            Download ↓
          </a>
        </div>
      </div>
    );
  }

  let buttonLabel = 'Approve & fill PDF →';
  let buttonClass = 'bg-accent text-bg hover:bg-accent/90';
  let disabled = state.kind === 'loading';

  if (state.kind === 'loading') {
    buttonLabel = 'Calling Pulse…';
    buttonClass = 'bg-accent/40 text-bg';
  }
  if (state.kind === 'error') {
    buttonLabel = 'Retry';
    buttonClass = 'bg-danger text-bg';
    disabled = false;
  }

  return (
    <div>
      <div
        className={`w-full h-[3px] bg-border/40 relative overflow-hidden transition-opacity duration-300 ${showBar ? 'opacity-100' : 'opacity-0'}`}
      >
        <div
          className="absolute inset-y-0 left-0 bg-accent"
          style={{ width: `${barW}%`, transition }}
        />
      </div>
      <div className="flex items-center justify-end gap-4 px-4 py-4">
        <button
          onClick={onApprove}
          disabled={disabled}
          className={`font-mono text-xs px-4 py-2 min-h-[44px] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonClass}`}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
