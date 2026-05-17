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
      // Slow-fill toward 85% over ~10s — covers both fill calls
      setBarTransition('width 10s cubic-bezier(0.25, 0, 0.05, 1)');
      setBarW(85);
    } else if (state.kind === 'done') {
      // Snap to 100%
      setBarTransition('width 0.4s ease-out');
      setBarW(100);
    } else if (state.kind === 'idle' || state.kind === 'error') {
      setBarTransition('none');
      setBarW(0);
    }
    // 'partial': reviewer done, Pulse still running — let animation continue
  }, [state.kind]);

  const unreviewed = fields.filter((f) => f.needsReview && !f.reviewed).length;
  const ready = unreviewed === 0;
  const status = ready
    ? 'All fields reviewed · ready to fill'
    : `${unreviewed} field${unreviewed === 1 ? '' : 's'} need${unreviewed === 1 ? 's' : ''} review`;

  let buttonLabel = 'Generate filled PDFs →';
  let buttonClass = 'bg-accent text-bg hover:bg-accent/90';
  let disabled = !ready || state.kind === 'loading' || state.kind === 'partial';

  if (state.kind === 'loading') {
    buttonLabel = 'Generating reviewer render…';
    buttonClass = 'bg-accent/40 text-bg';
  }
  if (state.kind === 'partial') {
    buttonLabel = 'Reviewer ready · waiting on Pulse…';
    buttonClass = 'bg-accent/40 text-bg';
  }
  if (state.kind === 'done') {
    buttonLabel = '✓ Both PDFs ready below';
    buttonClass = 'bg-accent text-bg';
    disabled = true;
  }
  if (state.kind === 'error') {
    buttonLabel = 'Retry';
    buttonClass = 'bg-danger text-bg';
    disabled = false;
  }

  const showBar = state.kind === 'loading' || state.kind === 'partial' || state.kind === 'done';

  return (
    <div>
      {/* Progress track — always in DOM so CSS transition has a starting position */}
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
