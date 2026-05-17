// components/Comparison.tsx
'use client';

interface Props {
  pulseUrl?: string;
  reviewerUrl: string;
  pulseIsPrebaked?: boolean;
}

export function Comparison({ pulseUrl, reviewerUrl, pulseIsPrebaked }: Props) {
  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="font-mono text-xs text-fg-dim mb-1">SAME EDITS · TWO RENDERS</div>
      <h3 className="font-display text-2xl mb-1">Pulse Form Fill vs Reviewer-rendered</h3>
      <p className="text-sm text-fg-muted mb-5">
        Identical field values, sent through both pipelines. The gap is the UI layer&apos;s value.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        {pulseUrl ? (
          <ComparisonCard
            label="Pulse Form Fill"
            sub={pulseIsPrebaked ? '/prebaked · live render timed out on Vercel Hobby' : '/form/fill with NL instructions'}
            url={pulseUrl}
            filename="pulse_render.pdf"
            isPrebaked={pulseIsPrebaked}
          />
        ) : (
          <div className="bg-bg-elev-2 rounded-md border border-border p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="font-mono text-xs text-fg-dim mb-2">PULSE FORM FILL</div>
              <div className="text-sm text-fg-muted">Rendering&hellip; Pulse takes 60-235s</div>
            </div>
          </div>
        )}
        <ComparisonCard
          label="Reviewer-rendered"
          sub="pdf-lib stamp at hand-tuned input zones"
          url={reviewerUrl}
          filename="reviewer_render.pdf"
        />
      </div>
    </div>
  );
}

function ComparisonCard({
  label, sub, url, filename, isPrebaked,
}: {
  label: string; sub: string; url: string; filename: string; isPrebaked?: boolean;
}) {
  return (
    <div className="bg-bg-elev-2 rounded-md overflow-hidden border border-border">
      <div className="px-4 py-2 flex items-center justify-between border-b border-border">
        <div>
          <div className="font-mono text-xs text-fg">{label}</div>
          <div className={`font-mono text-[10px] ${isPrebaked ? 'text-warn' : 'text-fg-dim'}`}>{sub}</div>
        </div>
        <a href={url} download={filename} className="font-mono text-xs text-accent hover:underline">
          download ↓
        </a>
      </div>
      <iframe src={url} className="w-full aspect-[8.5/11] bg-white" title={label} />
    </div>
  );
}
