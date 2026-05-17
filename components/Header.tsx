export function Header() {
  return (
    <header className="border-b border-border pb-8 mb-12">
      <div
        className="font-mono text-xs text-fg-dim uppercase tracking-widest mb-6 flex items-center opacity-0 animate-[riseIn_400ms_ease-out_forwards]"
        style={{ animationDelay: '0ms' }}
      >
        <span
          className="inline-block w-2 h-2 rounded-full bg-accent mr-2 animate-[pulseDot_1.4s_ease-in-out_infinite]"
        />
        PDF EDITING PROTOTYPE
      </div>

      <h1
        className="font-display text-4xl md:text-5xl font-normal leading-[1.02] tracking-[-0.01em] mb-5 opacity-0 animate-[riseIn_400ms_ease-out_forwards]"
        style={{ animationDelay: '80ms' }}
      >
        Form Fill shipped the engine.
        <br />
        <em className="italic text-accent">Here&apos;s the layer above it.</em>
      </h1>

      <p
        className="text-fg-muted text-base md:text-lg mt-3 max-w-[520px] opacity-0 animate-[riseIn_400ms_ease-out_forwards]"
        style={{ animationDelay: '160ms' }}
      >
        One screen. Real PDF in, real PDF out. The piece you didn&apos;t ship yet, sketched honestly.
      </p>

      <div
        className="font-mono text-xs text-fg-dim mt-4 flex gap-4 flex-wrap opacity-0 animate-[riseIn_400ms_ease-out_forwards]"
        style={{ animationDelay: '240ms' }}
      >
        <span>READ TIME · 3 MIN</span>
        <span>·</span>
        <span>DEMO · INTERACTIVE</span>
      </div>
    </header>
  );
}
