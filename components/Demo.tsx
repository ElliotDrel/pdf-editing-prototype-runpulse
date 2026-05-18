// components/Demo.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { SAMPLE_FIELDS } from '@/lib/sample-data';
import { REFERRAL_FIELDS } from '@/lib/referral-data';
import type { Field, PdfKey } from '@/lib/types';
import { PdfEditPane } from './PdfEditPane';
import { ApproveBar } from './ApproveBar';

export type ApproveState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; pulseUrl: string; pulseIsPrebaked?: boolean }
  | { kind: 'error'; message: string };

type Phase = 'selecting' | 'reviewing';
type LeftView = 'original' | 'filled';

const PDF_SRC: Record<PdfKey, string> = {
  'prior-auth': '/sample-prior-auth.pdf#toolbar=0&navpanes=0&scrollbar=0',
  'referral': '/sample-referral.pdf#toolbar=0&navpanes=0&scrollbar=0',
};

const FILL_EXPECTED_MS = 60_000;

export function Demo() {
  const [phase, setPhase] = useState<Phase>('selecting');
  const [pdfKey, setPdfKey] = useState<PdfKey>('prior-auth');
  const [fields, setFields] = useState<Field[]>([]);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [approve, setApprove] = useState<ApproveState>({ kind: 'idle' });
  const [leftView, setLeftView] = useState<LeftView>('original');
  const reviewRef = useRef<HTMLDivElement>(null);
  const clearedPdfRef = useRef<Promise<Blob | null> | null>(null);

  useEffect(() => {
    if (approve.kind === 'done') setLeftView('filled');
  }, [approve.kind]);

  function updateField(id: string, patch: Partial<Field>) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch, reviewed: true } : f)));
  }

  function selectPdf(key: PdfKey) {
    setPdfKey(key);
    setFields(key === 'referral' ? REFERRAL_FIELDS : SAMPLE_FIELDS);
    setApprove({ kind: 'idle' });
    setActiveFieldId(null);
    setLeftView('original');
    clearedPdfRef.current = null;
    setPhase('reviewing');
    setTimeout(() => reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

    clearedPdfRef.current = fetch('/api/form-clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdfKey: key }),
    }).then((r) => (r.ok ? r.blob() : null)).catch(() => null);
  }

  async function onApprove() {
    setApprove({ kind: 'loading' });

    const fieldSlims = fields.map((f) => ({ id: f.id, label: f.label, value: f.value, type: f.type }));

    try {
      const clearedBlob = clearedPdfRef.current ? await clearedPdfRef.current : null;

      let res: Response;
      if (clearedBlob) {
        const fd = new FormData();
        fd.append('file', clearedBlob, 'cleared.pdf');
        fd.append('fields', JSON.stringify(fieldSlims));
        res = await fetch('/api/form-fill/pulse', { method: 'POST', body: fd });
      } else {
        res = await fetch('/api/form-fill/pulse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfKey, fields: fieldSlims }),
        });
      }

      if (!res.ok) throw new Error(`pulse ${res.status}`);
      const pulseUrl = URL.createObjectURL(await res.blob());
      setApprove({ kind: 'done', pulseUrl });
    } catch {
      setApprove({ kind: 'done', pulseUrl: '/prebaked-pulse-fill.pdf', pulseIsPrebaked: true });
    }
  }

  return (
    <section className="w-full">
      {phase === 'selecting' && (
        <div className="px-8 lg:px-16 py-8">
          <div className="max-w-[1200px] mx-auto">
            <div className="font-mono text-[10px] uppercase tracking-widest text-fg-dim mb-6">
              Step 1 · Pick a PDF to fill
            </div>
            <div className="grid grid-cols-2 gap-8">
            {(['prior-auth', 'referral'] as PdfKey[]).map((key) => (
              <div
                key={key}
                className="relative rounded-xl overflow-hidden border border-border hover:border-accent/50 transition-colors duration-200 h-[640px] cursor-pointer"
                onClick={() => selectPdf(key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectPdf(key); }}
              >
                <iframe
                  src={PDF_SRC[key]}
                  className="w-full h-full"
                  style={{ pointerEvents: 'none' }}
                />
              </div>
            ))}
            </div>
          </div>
        </div>
      )}

      {phase === 'reviewing' && (
        <div ref={reviewRef} className="w-full border-y border-border">
          <div className="px-8 lg:px-16 py-3 border-b border-border bg-bg-elev flex items-center gap-4">
            <button
              onClick={() => { setPhase('selecting'); setApprove({ kind: 'idle' }); setLeftView('original'); }}
              className="font-mono text-xs text-fg-dim hover:text-fg transition-colors"
              aria-label="Back"
            >
              ← change PDF
            </button>
            <span className="text-border">·</span>
            <div className="font-mono text-[10px] uppercase tracking-widest text-fg-dim">
              {approve.kind === 'idle' && 'Step 2 · Edit the fields Pulse extracted. Step 3 · Click approve.'}
              {approve.kind === 'loading' && 'Calling Pulse /form/fill...'}
              {approve.kind === 'done' && 'Done · Pulse returned the filled PDF on the left'}
              {approve.kind === 'error' && 'Pulse call failed. Retry.'}
            </div>
          </div>

          <div className="px-8 lg:px-16 py-6 bg-bg">
            <div className="grid grid-cols-2 gap-6 mb-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-fg-dim">
                {approve.kind === 'done' && leftView === 'filled'
                  ? 'PDF · filled by Pulse'
                  : 'PDF'}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-fg-dim">
                Editable form · extracted by Pulse
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 items-start">

              <div className="rounded-xl overflow-hidden border border-border">
                {approve.kind === 'done' && (
                  <div className="px-3 py-2 bg-bg-elev border-b border-border flex justify-end">
                    <div className="flex items-center gap-1 bg-bg rounded-md p-0.5">
                      <button
                        onClick={() => setLeftView('filled')}
                        className={`font-mono text-[10px] px-2.5 py-1 rounded transition-colors ${
                          leftView === 'filled' ? 'bg-bg-elev-2 text-fg' : 'text-fg-dim hover:text-fg'
                        }`}
                      >
                        Filled
                      </button>
                      <button
                        onClick={() => setLeftView('original')}
                        className={`font-mono text-[10px] px-2.5 py-1 rounded transition-colors ${
                          leftView === 'original' ? 'bg-bg-elev-2 text-fg' : 'text-fg-dim hover:text-fg'
                        }`}
                      >
                        Original
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-bg-elev-2" style={{ height: '640px' }}>
                  <iframe
                    src={
                      leftView === 'filled' && approve.kind === 'done'
                        ? approve.pulseUrl
                        : PDF_SRC[pdfKey]
                    }
                    className="w-full h-full"
                  />
                </div>
              </div>

              <div className="flex flex-col rounded-xl overflow-hidden border border-border">
                <div className="p-5 bg-bg-elev-2">
                  <PdfEditPane
                    fields={fields}
                    activeFieldId={activeFieldId}
                    pdfKey={pdfKey}
                    onSelectField={setActiveFieldId}
                    onUpdateField={updateField}
                  />
                </div>
                <div className="border-t border-border bg-bg-elev mt-auto">
                  <ApproveBar state={approve} onApprove={onApprove} expectedMs={FILL_EXPECTED_MS} />
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </section>
  );
}
