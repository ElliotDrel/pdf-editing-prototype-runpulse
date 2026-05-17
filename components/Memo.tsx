export function Memo() {
  return (
    <section className="mt-14">

      {/* 1. The reframe */}
      <h2 className="font-display font-normal text-3xl tracking-tight text-fg mb-4">
        The reframe
      </h2>
      <p className="text-base leading-relaxed text-fg mb-4">
        Pulse Form Fill is fast and almost-right. Run it on this prior auth and values land
        approximately one row above where a human would put them. The engine works; the review
        layer is what catches the offset before submission. This page renders both outputs from
        the same edits — you&apos;ll see the gap.
      </p>
      <p className="text-base leading-relaxed text-fg mb-4">
        What Form Fill <em>doesn&apos;t</em> have, yet, is a surface where a human reviews and
        corrects before it commits. The thing above is a sketch of that surface. Confidence-scored
        fields, flag the low ones, edit inline, then call Form Fill.
      </p>

      {/* 2. Why this specific UI matters */}
      <h2 className="font-display font-normal text-3xl tracking-tight text-fg mt-14 mb-4">
        Why this <em className="italic text-fg-muted">specific</em> UI matters
      </h2>
      <p className="text-base leading-relaxed text-fg mb-4">
        Generic PDF editors exist. Adobe, PDFescape, fifty SaaS clones. None of them are useful
        to your customers because none of them know what&apos;s{' '}
        <strong className="text-accent font-medium">actually in the document</strong>.
      </p>
      <p className="text-base leading-relaxed text-fg mb-4">
        You do. Your layout model already returns the bounding box, the field type, and a
        confidence number. Translating that into a review pane is mostly UI work, because the
        model has already done the thinking. Anyone else building this UI has to start from raw
        pixels. You start from structured semantics.
      </p>

      {/* 3. Three ways it could ship */}
      <h2 className="font-display font-normal text-3xl tracking-tight text-fg mt-14 mb-4">
        Three ways it could ship
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5">

        <div className="border border-border rounded-xl p-5 bg-bg-elev hover:border-[#3A3631] transition-colors">
          <div className="font-mono text-[10px] tracking-widest uppercase text-fg-dim mb-1.5">
            PLAY 1 · ENTERPRISE
          </div>
          <h4 className="font-display font-normal text-xl tracking-tight text-fg mb-1.5">
            Internal review console
          </h4>
          <p className="text-sm leading-snug text-fg-muted mb-2">
            A hosted dashboard inside the Pulse platform. Customers upload, your stack extracts +
            fills, a human reviewer in their org approves edge cases. Sold as a tier above the raw
            API.
          </p>
          <div className="font-mono text-[11px] text-fg-dim">
            <span className="text-fg-muted font-medium">For:</span> Captures the verification budget
            regulated industries already spend.{' '}
            <span className="text-fg-muted font-medium">Against:</span> You become a workflow product,
            not pure infra.
          </div>
        </div>

        <div className="border border-border rounded-xl p-5 bg-bg-elev hover:border-[#3A3631] transition-colors">
          <div className="font-mono text-[10px] tracking-widest uppercase text-fg-dim mb-1.5">
            PLAY 2 · DEVELOPER
          </div>
          <h4 className="font-display font-normal text-xl tracking-tight text-fg mb-1.5">
            Embeddable widget · &lt;PulseReview /&gt;
          </h4>
          <p className="text-sm leading-snug text-fg-muted mb-2">
            A React component your customers drop into their own app. They pass in a document ID,
            you handle render + edit + commit. Stripe Checkout, for PDFs.
          </p>
          <div className="font-mono text-[11px] text-fg-dim">
            <span className="text-fg-muted font-medium">For:</span> Stays infra-flavored. Drives API
            adoption inside existing customer products.{' '}
            <span className="text-fg-muted font-medium">Against:</span> Component support burden grows
            with every framework.
          </div>
        </div>

        <div className="border border-border rounded-xl p-5 bg-bg-elev hover:border-[#3A3631] transition-colors">
          <div className="font-mono text-[10px] tracking-widest uppercase text-fg-dim mb-1.5">
            PLAY 3 · GROWTH
          </div>
          <h4 className="font-display font-normal text-xl tracking-tight text-fg mb-1.5">
            Free public demo · &ldquo;see Pulse on your doc&rdquo;
          </h4>
          <p className="text-sm leading-snug text-fg-muted mb-2">
            Upload any PDF, see extraction + edit + form-fill happen in 10 seconds, get the
            structured output. No signup, watermark on the result. Pure adoption funnel.
          </p>
          <div className="font-mono text-[11px] text-fg-dim">
            <span className="text-fg-muted font-medium">For:</span> Bottom-up POC accelerator. Sales
            calls start with &ldquo;I already tried it.&rdquo;{' '}
            <span className="text-fg-muted font-medium">Against:</span> Costs compute and gives the
            engine away for free; some leakage to non-customers.
          </div>
        </div>

      </div>

      {/* 4. The honest counter */}
      <h2 className="font-display font-normal text-3xl tracking-tight text-fg mt-14 mb-4">
        The honest counter
      </h2>
      <p className="text-base leading-relaxed text-fg-muted mb-4">
        Pulse is positioned as infrastructure. Layout models, OCR, accuracy benchmarks. A UI
        product invites comparison to a different category and could pull engineering hours away
        from making the core model better. The most expensive thing for a company at your stage
        isn&apos;t building the wrong thing. It&apos;s building too many right-adjacent things.
      </p>
      <p className="text-base leading-relaxed text-fg-muted mb-4">
        If I were you I&apos;d probably weigh Play 2 hardest. It&apos;s the version that stays a
        developer tool. Play 3 is the version that sells the most API calls. Play 1 is the version
        that changes what kind of company Pulse is. All three are reasonable. None of them is
        obvious.
      </p>

      {/* 5. What this prototype is and isn't */}
      <h2 className="font-display font-normal text-3xl tracking-tight text-fg mt-14 mb-4">
        What this prototype is and isn&apos;t
      </h2>
      <p className="text-base leading-relaxed text-fg mb-4">
        The demo above hits the real Pulse API. The document is pre-baked but the extraction,
        confidence scores, and filled PDF on approve are live. What it doesn&apos;t do is let you
        upload your own file. That&apos;s a v1 scope call, not a technical limit.
      </p>
      <p className="text-base leading-relaxed text-fg mb-4">
        What it gets right is the interaction model: scan-once on load, confidence-flagged review
        queue, click-through-to-source, low-confidence fields require a touch before approve
        unlocks, and the approve button kicks off a Form Fill call.
      </p>

      {/* 6. If you wanted to go further */}
      <h2 className="font-display font-normal text-3xl tracking-tight text-fg mt-14 mb-4">
        If you wanted to go further
      </h2>

      <div className="bg-bg-elev border border-border rounded-xl p-5 my-4">
        <h4 className="font-display font-normal text-lg text-fg-muted mb-3">
          How I&apos;d actually build the v0
        </h4>
        <ol className="list-decimal pl-5 text-fg text-sm leading-loose space-y-1">
          <li>
            Backend: thin proxy over Pulse Extract. Return rendered PNG per page plus bbox +
            confidence + field type per region.
          </li>
          <li>
            Frontend: render the PNG, overlay positioned inputs at each bbox. Sync edits two-way
            between overlay and side panel.
          </li>
          <li>
            Routing: any field below{' '}
            <code className="font-mono text-[13px] bg-bg-elev-2 px-1.5 py-0.5 rounded border border-border text-fg">
              conf &lt; 0.85
            </code>{' '}
            goes into the review queue, blocks approve until touched.
          </li>
          <li>
            On approve:{' '}
            <code className="font-mono text-[13px] bg-bg-elev-2 px-1.5 py-0.5 rounded border border-border text-fg">
              POST /form-fill
            </code>{' '}
            with the corrected values, stream back the filled PDF.
          </li>
          <li>
            Audit log: every human edit recorded with reviewer ID. Regulated customers will require
            this.
          </li>
        </ol>
        <div className="mt-4 pt-3 border-t border-dashed border-[#3A3631] font-mono text-xs text-fg-muted">
          Effort estimate · ~2 focused weeks for a v0 demo · ~6 weeks for an enterprise-ready embed
        </div>
      </div>

      <p className="text-base leading-relaxed text-fg mb-4">
        If any of this tracks, I&apos;d love to go further on it. If not, I&apos;d love to know
        which part doesn&apos;t, because I&apos;d rather get sharper than be polite.
      </p>

    </section>
  );
}
