// components/Demo.tsx
'use client';

import { useState } from 'react';
import { SAMPLE_FIELDS } from '@/lib/sample-data';
import type { Field } from '@/lib/types';
import { PdfPane } from './PdfPane';
import { ReviewPane } from './ReviewPane';
import { ApproveBar } from './ApproveBar';
import { Comparison } from './Comparison';

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

  async function onApprove() {
    setApprove({ kind: 'loading' });

    const payload = JSON.stringify({
      fields: fields.map((f) => ({ id: f.id, label: f.label, value: f.value, type: f.type })),
    });

    // Fire both simultaneously
    const pulsePromise = fetch('/api/form-fill/pulse', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload,
    });
    const reviewerPromise = fetch('/api/form-fill/reviewer', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload,
    });

    // Show reviewer as soon as it returns (~1-5s)
    let reviewerUrl: string;
    try {
      const reviewerRes = await reviewerPromise;
      if (!reviewerRes.ok) throw new Error(`reviewer endpoint ${reviewerRes.status}`);
      reviewerUrl = URL.createObjectURL(await reviewerRes.blob());
      setApprove({ kind: 'partial', reviewerUrl });
    } catch (err) {
      console.error('reviewer failed:', err);
      setApprove({ kind: 'error', message: err instanceof Error ? err.message : 'reviewer failed' });
      return;
    }

    // Wait for Pulse -- fallback to pre-baked if it times out
    try {
      const pulseRes = await pulsePromise;
      if (!pulseRes.ok) throw new Error(`pulse endpoint ${pulseRes.status}`);
      const pulseUrl = URL.createObjectURL(await pulseRes.blob());
      setApprove({ kind: 'done', reviewerUrl, pulseUrl });
    } catch (err) {
      console.error('pulse timed out or failed, using pre-baked:', err);
      setApprove({ kind: 'done', reviewerUrl, pulseUrl: '/prebaked-pulse-fill.pdf', pulseIsPrebaked: true });
    }
  }

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
      {(approve.kind === 'partial' || approve.kind === 'done') && (
        <Comparison
          reviewerUrl={approve.reviewerUrl}
          pulseUrl={approve.kind === 'done' ? approve.pulseUrl : undefined}
          pulseIsPrebaked={approve.kind === 'done' ? approve.pulseIsPrebaked : undefined}
        />
      )}
    </section>
  );
}
