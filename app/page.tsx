import { Demo } from '@/components/Demo';

export default function Page() {
  return (
    <main className="min-h-screen">
      <header className="px-8 lg:px-16 pt-16 pb-2 max-w-[1200px] mx-auto">
        <div className="font-mono text-[10px] uppercase tracking-widest text-accent/70 mb-3">
          Pulse Form Fill · proof of concept
        </div>
        <h1 className="font-display text-3xl text-fg leading-tight mb-3">
          A UI layer on top of Pulse.
        </h1>
        <p className="text-fg-muted text-sm max-w-[640px]">
          Pick a PDF. Pulse extracts the fields. Edit them on the right.
          Approve and Pulse fills the real PDF, which loads on the left.
        </p>
      </header>
      <Demo />
    </main>
  );
}
