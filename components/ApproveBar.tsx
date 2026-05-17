// components/ApproveBar.tsx
'use client';

import type { Field } from '@/lib/types';
import type { ApproveState } from './Demo';

interface Props {
  fields: Field[];
  state: ApproveState;
  onApprove: () => void;
}

export function ApproveBar({ fields, state, onApprove }: Props) {
  const unreviewed = fields.filter((f) => f.needsReview && !f.reviewed).length;
  const ready = unreviewed === 0;
  const status = ready
    ? 'All fields reviewed · ready to fill'
    : `${unreviewed} field${unreviewed === 1 ? '' : 's'} need${unreviewed === 1 ? 's' : ''} review`;

  let buttonLabel = 'Approve & generate filled PDFs →';
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

  return (
    <div className="mt-5 flex items-center justify-between gap-4 pt-4 border-t border-border">
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
  );
}
