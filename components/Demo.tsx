// components/Demo.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { SAMPLE_FIELDS } from '@/lib/sample-data';
import { REFERRAL_FIELDS } from '@/lib/referral-data';
import type { Field, PdfKey, ExtractSource, RenderBlock } from '@/lib/types';
import { PdfEditPane } from './PdfEditPane';
import { PdfExtractRender } from './PdfExtractRender';
import { ApproveBar } from './ApproveBar';
import { Comparison } from './Comparison';

export type ApproveState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'partial'; reviewerUrl: string }
  | { kind: 'done'; pulseUrl: string; reviewerUrl: string; pulseIsPrebaked?: boolean }
  | { kind: 'error'; message: string };

type Phase = 'selecting' | 'extracting' | 'reviewing';

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

const EXTRACT_STEPS = [
  'Uploading to Pulse API...',
  'OCR pass running · 1 page',
  'Layout analysis complete',
  'VLM pass · matching fields...',
  'Building confidence scores...',
];

const PDF_SRC: Record<PdfKey, string> = {
  'prior-auth': '/sample-prior-auth.pdf#toolbar=0&navpanes=0&scrollbar=0',
  'referral': '/sample-referral.pdf#toolbar=0&navpanes=0&scrollbar=0',
};

function FillNotification({
  onDismiss,
  onNavigate,
}: {
  onDismiss: () => void;
  onNavigate: () => void;
}) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 16);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`fixed top-6 right-6 z-50 w-[320px] rounded-xl border border-accent/25 bg-bg-elev shadow-2xl overflow-hidden transition-all duration-300 ease-out ${
        entered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
      }`}
    >
      <div className="h-[3px] bg-accent" />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0"
              style={{ animation: 'pulseDot 2s ease-in-out infinite' }}
            />
            <span className="font-mono text-[9px] uppercase tracking-widest text-accent">
              Pulse fill complete
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="font-mono text-[11px] text-fg-dim hover:text-fg transition-colors"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
        <div
          role="button"
          tabIndex={0}
          className="cursor-pointer group"
          onClick={onNavigate}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate(); }}
        >
          <p className="font-body text-sm text-fg-muted leading-snug mb-2">
            Both PDFs are ready. Pulse and reviewer renders are side by side below.
          </p>
          <p className="font-mono text-[10px] text-fg-dim group-hover:text-accent transition-colors duration-150">
            Jump to comparison →
          </p>
        </div>
      </div>
    </div>
  );
}

function ExtractionLoader({ pdfKey }: { pdfKey: PdfKey }) {
  const meta = PDF_META[pdfKey];
  const [stepIdx, setStepIdx] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const step = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, EXTRACT_STEPS.length - 1));
    }, 1800);
    const dot = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => {
      clearInterval(step);
      clearInterval(dot);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span
            className="w-2 h-2 rounded-full bg-accent"
            style={{ animation: 'pulseDot 2.4s ease-in-out infinite' }}
          />
          <span className="font-mono text-xs text-accent uppercase tracking-widest">Calling Pulse API</span>
        </div>
        <div className="font-mono text-[11px] text-fg-dim">POST /extract · {meta.filename}</div>
      </div>

      <div className="w-full max-w-sm space-y-1">
        {EXTRACT_STEPS.map((step, i) => (
          <div
            key={step}
            className={`font-mono text-[11px] flex items-center gap-2 transition-all duration-500 ${
              i < stepIdx
                ? 'text-accent/60'
                : i === stepIdx
                ? 'text-fg-muted'
                : 'text-fg-dim/40'
            }`}
          >
            <span className="w-3 text-center">
              {i < stepIdx ? '✓' : i === stepIdx ? '·' : ' '}
            </span>
            <span>{step}{i === stepIdx ? dots : ''}</span>
          </div>
        ))}
      </div>

      <div className="font-mono text-[10px] text-fg-dim/50 text-center">
        Confidence scores reflect real Pulse API output
      </div>
    </div>
  );
}

export function Demo() {
  const [phase, setPhase] = useState<Phase>('selecting');
  const [pdfKey, setPdfKey] = useState<PdfKey>('prior-auth');
  const [fields, setFields] = useState<Field[]>([]);
  const [blocks, setBlocks] = useState<RenderBlock[]>([]);
  const [extractSource, setExtractSource] = useState<ExtractSource>('fallback');
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [approve, setApprove] = useState<ApproveState>({ kind: 'idle' });
  const [showFillNotif, setShowFillNotif] = useState(false);
  const reviewRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (approve.kind === 'done') setShowFillNotif(true);
    if (approve.kind === 'idle') setShowFillNotif(false);
  }, [approve.kind]);

  function updateField(id: string, patch: Partial<Field>) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch, reviewed: true } : f)));
  }

  async function selectPdf(key: PdfKey) {
    setPdfKey(key);
    setPhase('extracting');
    setFields([]);
    setBlocks([]);
    setApprove({ kind: 'idle' });
    setActiveFieldId(null);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfKey: key }),
      });
      if (!res.ok) throw new Error(`extract ${res.status}`);
      const data = (await res.json()) as { fields: Field[]; source: ExtractSource; blocks: RenderBlock[] };
      setFields(data.fields);
      setBlocks(data.blocks ?? []);
      setExtractSource(data.source);
    } catch {
      const fallback = key === 'referral' ? REFERRAL_FIELDS : SAMPLE_FIELDS;
      setFields(fallback);
      setExtractSource('fallback');
    }

    setPhase('reviewing');
    setTimeout(() => reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  async function onApprove() {
    setApprove({ kind: 'loading' });

    const payload = JSON.stringify({
      pdfKey,
      fields: fields.map((f) => ({ id: f.id, label: f.label, value: f.value, type: f.type })),
    });

    const pulsePromise = fetch('/api/form-fill/pulse', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload,
    });
    const reviewerPromise = fetch('/api/form-fill/reviewer', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload,
    });

    let reviewerUrl: string;
    try {
      const reviewerRes = await reviewerPromise;
      if (!reviewerRes.ok) throw new Error(`reviewer ${reviewerRes.status}`);
      reviewerUrl = URL.createObjectURL(await reviewerRes.blob());
      setApprove({ kind: 'partial', reviewerUrl });
    } catch (err) {
      setApprove({ kind: 'error', message: err instanceof Error ? err.message : 'reviewer failed' });
      return;
    }

    try {
      const pulseRes = await pulsePromise;
      if (!pulseRes.ok) throw new Error(`pulse ${pulseRes.status}`);
      const pulseUrl = URL.createObjectURL(await pulseRes.blob());
      setApprove({ kind: 'done', reviewerUrl, pulseUrl });
    } catch {
      setApprove({ kind: 'done', reviewerUrl, pulseUrl: '/prebaked-pulse-fill.pdf', pulseIsPrebaked: true });
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
                        <span className="font-mono text-sm text-accent">
                          Select →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(phase === 'extracting' || phase === 'reviewing') && (
        <div ref={reviewRef} className="border-y border-border">
          {/* Toolbar */}
          <div className="px-8 lg:px-16 py-3 flex items-center justify-between border-b border-border bg-bg-elev">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setPhase('selecting'); setApprove({ kind: 'idle' }); }}
                className="font-mono text-[10px] text-fg-dim hover:text-fg transition-colors"
              >
                ← change doc
              </button>
              <span className="text-border">|</span>
              <div className="font-mono text-xs text-fg-muted">{meta.filename}</div>
            </div>
            <div className="flex items-center gap-3">
              {extractSource === 'pulse' && phase === 'reviewing' && (
                <div className="font-mono text-[10px] text-accent/70">
                  ✓ Pulse /extract
                </div>
              )}
              <div className="font-mono text-xs text-accent">DEMO</div>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 lg:px-16 py-6 bg-bg">
            {phase === 'extracting' ? (
              <ExtractionLoader pdfKey={pdfKey} />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  {/* Left: real source PDF */}
                  <div className="flex flex-col rounded-xl overflow-hidden border border-border min-h-[640px]">
                    <div className="px-4 py-2.5 bg-bg-elev border-b border-border flex items-center justify-between flex-shrink-0">
                      <div className="font-mono text-xs text-fg-muted">{meta.filename}</div>
                      <div className="font-mono text-[10px] text-fg-dim">source · unedited</div>
                    </div>
                    <iframe
                      src={PDF_SRC[pdfKey]}
                      className="flex-1 w-full"
                      title={meta.label}
                    />
                  </div>

                  {/* Right: editable PDF render + generate */}
                  <div className="flex flex-col rounded-xl border border-border overflow-hidden min-h-[640px]">
                    <div className="px-4 py-2.5 bg-bg-elev border-b border-border flex-shrink-0 flex items-center justify-between">
                      <div>
                        <div className="font-mono text-xs text-fg">Edit fields</div>
                        <div className="font-mono text-[10px] text-fg-dim mt-0.5">
                          {fields.filter((f) => f.needsReview && !f.reviewed).length > 0
                            ? `${fields.filter((f) => f.needsReview && !f.reviewed).length} field${fields.filter((f) => f.needsReview && !f.reviewed).length !== 1 ? 's' : ''} flagged for review`
                            : 'All fields reviewed'}
                        </div>
                      </div>
                      <div className="font-mono text-[10px] text-fg-dim">edited copy</div>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto p-5 bg-bg-elev-2">
                      {blocks.length > 0 ? (
                        <PdfExtractRender
                          blocks={blocks}
                          fields={fields}
                          pdfKey={pdfKey}
                          activeFieldId={activeFieldId}
                          onSelectField={setActiveFieldId}
                          onUpdateField={updateField}
                        />
                      ) : (
                        <PdfEditPane
                          fields={fields}
                          activeFieldId={activeFieldId}
                          pdfKey={pdfKey}
                          onSelectField={setActiveFieldId}
                          onUpdateField={updateField}
                        />
                      )}
                    </div>
                    <div className="flex-shrink-0 border-t border-border bg-bg-elev">
                      <ApproveBar fields={fields} state={approve} onApprove={onApprove} />
                    </div>
                  </div>
                </div>

                {(approve.kind === 'partial' || approve.kind === 'done') && (
                  <div ref={comparisonRef}>
                    <Comparison
                      reviewerUrl={approve.reviewerUrl}
                      pulseUrl={approve.kind === 'done' ? approve.pulseUrl : undefined}
                      pulseIsPrebaked={approve.kind === 'done' ? approve.pulseIsPrebaked : undefined}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {showFillNotif && (
        <FillNotification
          onDismiss={() => setShowFillNotif(false)}
          onNavigate={() => {
            setShowFillNotif(false);
            comparisonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />
      )}
    </section>
  );
}
