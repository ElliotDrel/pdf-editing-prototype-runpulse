import type { ReactNode } from 'react';

interface Props {
  left?: ReactNode;
  right?: ReactNode;
}

export function RunpulseLink() {
  return (
    <a
      href="https://runpulse.com"
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-[10px] uppercase tracking-widest text-fg-dim hover:text-fg transition-colors whitespace-nowrap"
    >
      runpulse.com ↗
    </a>
  );
}

export function AppHeader({ left, right }: Props) {
  return (
    <header className="sticky top-0 z-10 px-8 lg:px-16 py-4 border-b border-border bg-bg-elev w-full flex-shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
      <div className="min-w-0">{left}</div>
      <div className="flex items-center gap-3 justify-self-center">
        <span className="font-display text-lg text-fg tracking-wide font-medium whitespace-nowrap">
          Pulse Form Fill
        </span>
        <span className="text-border">·</span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded whitespace-nowrap">
          proof of concept
        </span>
      </div>
      <div className="min-w-0 justify-self-end text-right">{right}</div>
    </header>
  );
}
