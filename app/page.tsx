import { PdfSelector } from "@/components/PdfSelector";

export default function Page() {
	return (
		<main className="min-h-screen lg:h-screen lg:overflow-hidden lg:flex lg:flex-col">
			<header className="px-8 lg:px-16 py-4 border-b border-border bg-bg-elev w-full flex-shrink-0 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<span className="font-display text-lg text-fg tracking-wide font-medium">
						Pulse Form Fill
					</span>
					<span className="text-border">·</span>
					<span className="font-mono text-[9px] uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded">
						proof of concept
					</span>
				</div>
				<div className="flex items-center gap-4">
					<span className="hidden md:inline font-mono text-[10px] text-fg-dim">
						A UI layer on top of Pulse Form Fill
					</span>
					<a
						href="https://runpulse.com"
						target="_blank"
						rel="noopener noreferrer"
						className="font-mono text-[10px] uppercase tracking-widest text-fg-dim hover:text-fg transition-colors"
					>
						runpulse.com ↗
					</a>
				</div>
			</header>
			<PdfSelector />
		</main>
	);
}
