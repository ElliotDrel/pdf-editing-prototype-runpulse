// components/Demo.tsx
'use client';

import { useState } from 'react';
import { SAMPLE_FIELDS } from '@/lib/sample-data';
import type { Field } from '@/lib/types';
import { PdfPane } from './PdfPane';
import { ReviewPane } from './ReviewPane';
import { ApproveBar } from './ApproveBar';

export type ApproveState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'partial'; reviewerUrl: string }
  | { kind: 'done'; pulseUrl: string; reviewerUrl: string; pulseIsPrebaked?: boolean }
  | { kind: 'error'; message: string };

export function Demo() {
  const [fields, setFields] = useState<Field[]>(SAMPLE_FIELDS);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [approve, setApprove] = useState<ApproveState>({ kind: 'idle' });

  function updateField(id: string, patch: Partial<Field>) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch, reviewed: true } : f)));
  }

  const onApprove = () => {
    setApprove({ kind: 'loading' });
    setTimeout(() => setApprove({ kind: 'idle' }), 1000);
  };

  return (
    <section className="mt-12 rounded-xl border border-border bg-bg-elev p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="font-mono text-xs text-fg-dim">prior_auth_request_4421.pdf</div>
        <div className="font-mono text-xs text-accent">DEMO</div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <PdfPane fields={fields} activeFieldId={activeFieldId} onSelectField={setActiveFieldId} />
        <ReviewPane fields={fields} activeFieldId={activeFieldId} onSelectField={setActiveFieldId} onUpdateField={updateField} />
      </div>
      <ApproveBar fields={fields} state={approve} onApprove={onApprove} />
    </section>
  );
}
