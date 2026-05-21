import Link from "next/link";
import type { ReactNode } from "react";

import { MockModeBanner } from "@/components/MockModeBanner";

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
		<header className="sticky top-0 z-10 w-full flex-shrink-0 flex flex-col">
			<MockModeBanner />
			<div className="px-8 lg:px-16 py-3 border-b border-border bg-bg-elev grid grid-cols-[1fr_auto_1fr] items-center gap-3">
				<div className="min-w-0">{left}</div>
				<Link
					href="/"
					className="flex items-center gap-2.5 justify-self-center rounded-md px-1 py-0.5 -mx-1 hover:bg-bg-elev-2 transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent focus-visible:outline-offset-2"
					aria-label="Pulse Form Fill proof of concept, back to home"
				>
					<span className="font-display text-base text-fg tracking-wide font-medium whitespace-nowrap leading-none">
						Pulse Form Fill
					</span>
					<span className="text-border" aria-hidden="true">
						·
					</span>
					<span className="font-mono text-[9px] uppercase tracking-widest text-accent bg-accent/10 px-2 py-px rounded whitespace-nowrap leading-none">
						proof of concept
					</span>
				</Link>
				<div className="min-w-0 justify-self-end text-right">{right}</div>
			</div>
		</header>
	);
}
