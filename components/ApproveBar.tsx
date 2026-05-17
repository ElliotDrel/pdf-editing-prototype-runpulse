// components/ApproveBar.tsx
'use client';

import { useState, useEffect } from 'react';
import type { Field } from '@/lib/types';
import type { ApproveState } from './Demo';

interface Props {
  fields: Field[];
  state: ApproveState;
  onApprove: () => void;
}

export function ApproveBar({ fields, state, onApprove }: Props) {
  const [barW, setBarW] = useState(0);
  const [barTransition, setBarTransition] = useState('none');

  useEffect(() => {
    if (state.kind === 'loading') {
      setBarTransition('width 10s cubic-bezier(0.25, 0, 0.05, 1)');
      setBarW(85);
    } else if (state.kind === 'done') {
      setBarTransition('width 0.4s ease-out');
      setBarW(100);
    } else {
      setBarTransition('none');
      setBarW(0);
    }
  }, [state.kind]);

  const unreviewed = fields.filter((f) => f.needsReview && !f.reviewed).length;
  const ready = unreviewed === 0;
  const showBar = state.kind === 'loading' || state.kind === 'done';

  if (state.kind === 'done') {
    return (
      <div>
        <div className="w-full h-[3px] bg-border/40 relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-accent"
            style={{ width: `${barW}%`, transition: barTransition }}
          />
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-accent" />
            <span className="text-sm text-fg-muted">
              Pulse filled your PDF
              {state.pulseIsPrebaked && (
                <span className="font-mono text-[10px] text-warn ml-2">(prebaked · live render timed out)</span>
              )}
            </span>
          </div>
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

  const status = ready
    ? 'All fields reviewed · ready to fill'
    : `${unreviewed} field${unreviewed === 1 ? '' : 's'} need${unreviewed === 1 ? 's' : ''} review`;

  let buttonLabel = 'Approve & fill PDF →';
  let buttonClass = 'bg-accent text-bg hover:bg-accent/90';
  let disabled = !ready || state.kind === 'loading';

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
          style={{ width: `${barW}%`, transition: barTransition }}
        />
      </div>
      <div className="flex items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${ready ? 'bg-accent' : 'bg-warn'} animate-[pulseDot_1.4s_ease-in-out_infinite]`}
          />
          <span className="text-sm text-fg-muted">{status}</span>
        </div>
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
