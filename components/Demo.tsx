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

const PDF_META: Record<PdfKey, {
  label: string;
  sub: string;
  tag: string;
  filename: string;
  fieldCount: number;
}> = {
  'prior-auth': {
    label: 'Prior Authorization Request',
    sub: 'PA-2026-04421 · MEDPLAN COMMERCIAL',
    tag: 'Insurance / PA',
    filename: 'prior_auth_request_4421.pdf',
    fieldCount: 9,
  },
  'referral': {
    label: 'Specialist Referral Request',
    sub: 'SR-2026-0872 · BLUE CROSS PREFERRED',
    tag: 'Referral / Clinical',
    filename: 'specialist_referral_0872.pdf',
    fieldCount: 9,
  },
};

const PDF_SRC: Record<PdfKey, string> = {
  'prior-auth': '/sample-prior-auth.pdf#toolbar=0&navpanes=0&scrollbar=0',
  'referral': '/sample-referral.pdf#toolbar=0&navpanes=0&scrollbar=0',
};

// Measured average for Pulse /form/fill with a pre-cleared PDF: ~55 s.
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

  // Switch left panel to filled PDF when Pulse returns
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

    // Pre-clear the PDF in the background while the user edits fields
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

  const meta = PDF_META[pdfKey];

  return (
    <section className="w-full mt-8">
      {phase === 'selecting' && (
        <div className="px-8 lg:px-16 pt-8 pb-16">
          <div className="font-mono text-[10px] uppercase tracking-widest text-fg-dim mb-10">
            Pick a document · Pulse extracts the fields · You review · Approve sends the real fill call
          </div>
          <div className="grid grid-cols-2 gap-8">
            {(['prior-auth', 'referral'] as PdfKey[]).map((key) => {
              const m = PDF_META[key];
              return (
                <div key={key} className="group">
                  <div className="mb-5">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-accent/60 mb-2">{m.tag}</div>
                    <div className="font-display text-2xl text-fg leading-tight mb-1">{m.label}</div>
                    <div className="font-mono text-[11px] text-fg-dim">{m.sub} · {m.fieldCount} fields</div>
                  </div>

                  <div
                    className="relative rounded-xl overflow-hidden border border-border group-hover:border-accent/50 transition-colors duration-200 h-[560px] cursor-pointer"
                    onClick={() => selectPdf(key)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectPdf(key); }}
                    aria-label={`Select ${m.label}`}
                  >
                    <iframe
                      src={PDF_SRC[key]}
                      className="w-full h-full"
                      style={{ pointerEvents: 'none' }}
                      title={m.label}
                    />
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
                      <div className="absolute bottom-7 inset-x-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span className="font-mono text-sm text-accent">Select →</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {phase === 'reviewing' && (
        <div ref={reviewRef} className="border-y border-border">
          {/* Toolbar */}
          <div className="px-8 lg:px-16 py-3 flex items-center justify-between border-b border-border bg-bg-elev">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setPhase('selecting'); setApprove({ kind: 'idle' }); setLeftView('original'); }}
                className="font-mono text-[10px] text-fg-dim hover:text-fg transition-colors"
              >
                ← change doc
              </button>
              <span className="text-border">|</span>
              <div className="font-mono text-xs text-fg-muted">{meta.filename}</div>
            </div>
            <div className="font-mono text-xs text-accent">DEMO</div>
          </div>

          {/* Body */}
          <div className="px-8 lg:px-16 py-6 bg-bg">
            <div className="grid grid-cols-2 gap-6 items-start">

                {/* Left: PDF viewer — original or Pulse-filled */}
                <div className="rounded-xl overflow-hidden border border-border">
                  <div className="px-4 py-2.5 bg-bg-elev border-b border-border flex items-center justify-between flex-shrink-0">
                    <div className="font-mono text-xs text-fg-muted">
                      {leftView === 'filled' ? 'pulse_filled.pdf' : meta.filename}
                    </div>
                    {approve.kind === 'done' && (
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
                    )}
                  </div>

                  <div className="bg-bg-elev-2" style={{ height: '600px' }}>
                    <iframe
                      src={
                        leftView === 'filled' && approve.kind === 'done'
                          ? approve.pulseUrl
                          : PDF_SRC[pdfKey]
                      }
                      className="w-full h-full"
                      title={leftView === 'filled' ? 'Pulse filled PDF' : meta.filename}
                    />
                  </div>
                </div>

                {/* Right: editable HTML form + approve */}
                <div className="flex flex-col gap-0 rounded-xl overflow-hidden border border-border">
                  <div className="px-4 py-2.5 bg-bg-elev border-b border-border flex-shrink-0">
                    <div className="font-mono text-xs text-fg-muted">edited copy</div>
                  </div>
                  <div className="p-5 bg-bg-elev-2">
                    <PdfEditPane
                      fields={fields}
                      activeFieldId={activeFieldId}
                      pdfKey={pdfKey}
                      onSelectField={setActiveFieldId}
                      onUpdateField={updateField}
                    />
                  </div>
                  <div className="border-t border-border bg-bg-elev">
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
