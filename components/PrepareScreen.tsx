"use client";

import { useEffect, useRef, useState } from "react";

export type PrepareStep = "clear" | "extract";

interface Props {
	step: PrepareStep;
}

const STEPS: Array<{ id: PrepareStep; label: string; endpoint: string }> = [
	{ id: "clear", label: "Clearing form fields", endpoint: "POST /form/clear" },
	{
		id: "extract",
		label: "Extracting field values",
		endpoint: "POST /extract",
	},
];

const TICK_MS = 80;
const STEP_TARGET = 45;

export function PrepareScreen({ step }: Props) {
	const [barW, setBarW] = useState(0);
	const startTimeRef = useRef<number | null>(null);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const stepIndex = step === "clear" ? 0 : 1;
	const baseProgress = stepIndex * 50;

	useEffect(() => {
		startTimeRef.current = Date.now();
		queueMicrotask(() => setBarW(baseProgress));

		intervalRef.current = setInterval(() => {
			const elapsed = Date.now() - (startTimeRef.current ?? Date.now());
			const progress = elapsed / 30_000;
			const crawl = (1 - Math.exp(-progress * 0.8)) * STEP_TARGET;
			setBarW(Math.min(baseProgress + crawl, baseProgress + STEP_TARGET - 2));
		}, TICK_MS);

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [baseProgress]);

	return (
		<div className="flex flex-col items-center justify-center min-h-[480px] px-8 py-16">
			<div className="w-full max-w-md">
				<h2 className="font-display text-xl text-fg text-center mb-2">
					Preparing your template
				</h2>
				<p className="text-fg-dim text-sm text-center mb-8">
					Calling Pulse to clear the PDF and extract editable fields…
				</p>

				<ul className="space-y-3 mb-8">
					{STEPS.map((s, i) => {
						const status =
							i < stepIndex ? "done" : i === stepIndex ? "active" : "pending";
						return (
							<li
								key={s.id}
								className={`flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors duration-300 ${
									status === "active"
										? "border-accent/40 bg-accent/5"
										: status === "done"
											? "border-accent/20 bg-accent/[0.02]"
											: "border-border bg-bg-elev"
								}`}
							>
								<span
									className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full font-mono text-[10px] ${
										status === "done"
											? "bg-accent text-bg"
											: status === "active"
												? "border border-accent text-accent animate-pulse"
												: "border border-border text-fg-dim"
									}`}
								>
									{status === "done" ? "✓" : i + 1}
								</span>
								<div className="min-w-0 flex-1">
									<div
										className={`font-mono text-xs ${
											status === "pending" ? "text-fg-dim" : "text-fg"
										}`}
									>
										{s.label}
									</div>
									<div className="font-mono text-[10px] text-fg-dim mt-0.5">
										{s.endpoint}
									</div>
								</div>
								{status === "active" && (
									<svg
										aria-hidden="true"
										className="animate-spin h-4 w-4 text-accent flex-shrink-0 mt-0.5"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
								)}
							</li>
						);
					})}
				</ul>

				<div className="w-full h-[3px] bg-border/40 relative overflow-hidden rounded-full">
					<div
						className="absolute inset-y-0 left-0 bg-accent rounded-full transition-[width] duration-150"
						style={{ width: `${barW}%` }}
					/>
				</div>
			</div>
		</div>
	);
}
