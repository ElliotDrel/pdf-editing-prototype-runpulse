// components/ApproveBar.tsx
"use client";

import type { Ref } from "react";
import { useEffect, useRef, useState } from "react";
import type { ApproveState } from "./ReviewWorkspace";

interface Props {
	state: ApproveState;
	onApprove: () => void;
	expectedMs?: number;
	highlight?: boolean;
	containerRef?: Ref<HTMLDivElement>;
}

const TICK_MS = 80;
const ESTIMATE_MIN_MS = 60_000;
const ESTIMATE_MAX_MS = 90_000;
const PROGRESS_CAP = 97;

function formatRemaining(ms: number) {
	const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function ApproveBar({
	state,
	onApprove,
	expectedMs = 8000,
	highlight = false,
	containerRef,
}: Props) {
	const [barW, setBarW] = useState(0);
	const [elapsedMs, setElapsedMs] = useState(0);
	const startTimeRef = useRef<number | null>(null);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const estimateMaxMs = Math.max(expectedMs, ESTIMATE_MAX_MS);

	useEffect(() => {
		if (state.kind === "loading") {
			startTimeRef.current = Date.now();
			queueMicrotask(() => {
				setBarW(0);
				setElapsedMs(0);
			});

			intervalRef.current = setInterval(() => {
				const elapsed = Date.now() - (startTimeRef.current ?? Date.now());
				const progress = Math.min(elapsed / estimateMaxMs, 1);
				setElapsedMs(elapsed);
				setBarW(progress * PROGRESS_CAP);
			}, TICK_MS);
		} else {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			if (state.kind === "done") {
				queueMicrotask(() => {
					setBarW(100);
					setElapsedMs(estimateMaxMs);
				});
			} else if (state.kind === "idle" || state.kind === "error") {
				queueMicrotask(() => {
					setBarW(0);
					setElapsedMs(0);
				});
			}
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [state.kind, estimateMaxMs]);

	const showBar = state.kind === "loading" || state.kind === "done";
	const transition = state.kind === "done" ? "width 0.3s ease-out" : "none";
	const remainingMs = Math.max(estimateMaxMs - elapsedMs, 0);
	const remainingLabel =
		remainingMs > 0 ? `~${formatRemaining(remainingMs)} left` : "finishing up";

	if (state.kind === "done") {
		return (
			<div
				ref={containerRef}
				className={`transition-all duration-300 ${highlight ? "ring-2 ring-accent ring-offset-2 ring-offset-bg-elev shadow-[0_0_24px_rgba(77,255,136,0.28)]" : ""}`}
			>
				<div className="w-full h-[3px] bg-border/40 relative overflow-hidden">
					<div
						className="absolute inset-y-0 left-0 bg-accent"
						style={{ width: `${barW}%`, transition }}
					/>
				</div>
				<div className="px-4 py-4">
					<a
						href={state.pulseUrl}
						download="pulse_filled.pdf"
						className="font-mono text-xs px-4 py-2 min-h-[44px] w-full bg-accent text-bg rounded flex items-center justify-center hover:bg-accent/90 transition-colors"
					>
						Download ↓
					</a>
				</div>
			</div>
		);
	}

	let buttonClass = "bg-accent text-bg hover:bg-accent/90";
	let disabled = state.kind === "loading";

	if (state.kind === "error") {
		buttonClass = "bg-danger text-bg";
		disabled = false;
	}

	return (
		<div
			ref={containerRef}
			className={`transition-all duration-300 ${highlight ? "ring-2 ring-accent ring-offset-2 ring-offset-bg-elev shadow-[0_0_24px_rgba(77,255,136,0.28)]" : ""}`}
		>
			<div
				className={`w-full h-[3px] bg-border/40 relative overflow-hidden transition-opacity duration-300 ${showBar ? "opacity-100" : "opacity-0"}`}
			>
				<div
					className="absolute inset-y-0 left-0 bg-accent"
					style={{ width: `${barW}%`, transition }}
				/>
			</div>
			<div className="px-4 py-4">
				{state.kind === "loading" && (
					<div className="mb-2 text-center font-mono text-[10px] uppercase tracking-widest text-fg-dim">
						Average runtime: {ESTIMATE_MIN_MS / 1000}-{ESTIMATE_MAX_MS / 1000}{" "}
						seconds
					</div>
				)}
				<button
					type="button"
					onClick={onApprove}
					disabled={disabled}
					className={`font-mono text-xs px-4 py-2 min-h-[44px] w-full rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${buttonClass}`}
				>
					{state.kind === "loading" ? (
						<>
							<svg
								aria-hidden="true"
								className="animate-spin h-3.5 w-3.5 text-bg"
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
							<span>Calling Pulse… {remainingLabel}</span>
						</>
					) : state.kind === "error" ? (
						<span>Retry</span>
					) : (
						<span>Approve & fill PDF →</span>
					)}
				</button>
			</div>
		</div>
	);
}
