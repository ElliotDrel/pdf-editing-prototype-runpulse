// components/ReviewWorkspace.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
	clearFlow,
	getFlow,
	hasFilledPdf,
	hasPreparedFlow,
	onFillStored,
	patchFlow,
} from "@/lib/editable-form-flow-cache";
import {
	editableFormPreparePath,
	editableFormResultPath,
	editableFormReviewPath,
} from "@/lib/editable-form-routes";
import { isPublicMockMode } from "@/lib/mock-mode";
import { PDF_VIEWER_FRAME_CLASS } from "@/lib/pdf-viewer-layout";
import { REFERRAL_FIELDS } from "@/lib/referral-data";
import { SAMPLE_FIELDS } from "@/lib/sample-data";
import type { Field, PdfKey } from "@/lib/types";
import { AppHeader, RunpulseLink } from "./AppHeader";
import { ApproveBar } from "./ApproveBar";
import { HtmlExtractPlaceholder } from "./HtmlExtractPlaceholder";
import { PdfEditPane } from "./PdfEditPane";
import { PdfViewer } from "./PdfViewer";
import { PrepareScreen, type PrepareStep } from "./PrepareScreen";
import { ResultWorkspace } from "./ResultWorkspace";

export type ApproveState =
	| { kind: "idle" }
	| { kind: "loading" }
	| { kind: "done"; pulseUrl: string; pulseIsPrebaked?: boolean }
	| { kind: "error"; message: string };

export type EditableFormPhase = "prepare" | "review" | "result";

type LeftView = "source" | "cleared" | "filled";

type PrepareState = { kind: "loading"; step: PrepareStep } | { kind: "ready" };

const ORIGINAL_PDF: Record<PdfKey, string> = {
	"prior-auth": "/sample-prior-auth.pdf",
	referral: "/sample-referral.pdf",
};

const FILL_EXPECTED_MS = 90_000;

interface Props {
	pdfKey: PdfKey;
	phase: EditableFormPhase;
}

export function ReviewWorkspace({ pdfKey, phase }: Props) {
	const isMockMode = isPublicMockMode();
	const router = useRouter();
	const [prepare, setPrepare] = useState<PrepareState>({
		kind: "loading",
		step: "clear",
	});
	const [fields, setFields] = useState<Field[]>([]);
	const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
	const [approve, setApprove] = useState<ApproveState>({ kind: "idle" });
	const [leftView, setLeftView] = useState<LeftView>("cleared");
	const [clearedPdfUrl, setClearedPdfUrl] = useState<string | null>(null);
	const [highlightApprove, setHighlightApprove] = useState(false);
	const [resultFilledSrc, setResultFilledSrc] = useState<string | null>(null);
	const [resultClearedSrc, setResultClearedSrc] = useState<string | null>(null);
	const [hasFilledResult, setHasFilledResult] = useState(false);
	const clearedPdfBlobRef = useRef<Blob | null>(null);
	const approveBarRef = useRef<HTMLDivElement | null>(null);
	const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (phase !== "result") return;

		let filledUrl: string | null = null;
		let clearedUrl: string | null = null;

		function readFromCache() {
			const cached = getFlow(pdfKey);

			const nextFilledUrl = cached?.filledBlob
				? URL.createObjectURL(cached.filledBlob)
				: (cached?.prebakedFilledSrc ?? null);
			const nextClearedUrl = cached?.clearedBlob
				? URL.createObjectURL(cached.clearedBlob)
				: null;

			if (filledUrl?.startsWith("blob:")) URL.revokeObjectURL(filledUrl);
			if (clearedUrl) URL.revokeObjectURL(clearedUrl);
			filledUrl = nextFilledUrl;
			clearedUrl = nextClearedUrl;

			setResultFilledSrc(filledUrl);
			setResultClearedSrc(clearedUrl);
		}

		readFromCache();

		// Re-read if a fill lands while this page is already mounted
		const unsubscribe = onFillStored((key) => {
			if (key === pdfKey) readFromCache();
		});

		return () => {
			unsubscribe();
			if (filledUrl?.startsWith("blob:")) URL.revokeObjectURL(filledUrl);
			if (clearedUrl) URL.revokeObjectURL(clearedUrl);
		};
	}, [phase, pdfKey]);

	useEffect(() => {
		if (phase !== "review") return;
		setHasFilledResult(hasFilledPdf(pdfKey));
	}, [phase, pdfKey]);

	useEffect(() => {
		if (phase !== "prepare") return;
		if (prepare.kind !== "ready") return;
		router.replace(editableFormReviewPath(pdfKey));
	}, [phase, prepare.kind, pdfKey, router]);

	useEffect(() => {
		return () => {
			if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
		};
	}, []);

	useEffect(() => {
		if (phase === "result") return;

		let cancelled = false;
		let displayUrl: string | null = null;
		const fallbackFields =
			pdfKey === "referral" ? REFERRAL_FIELDS : SAMPLE_FIELDS;

		function revokeDisplayUrl() {
			if (displayUrl) {
				URL.revokeObjectURL(displayUrl);
				displayUrl = null;
			}
		}

		function hydrateFromCache() {
			const cached = getFlow(pdfKey);
			if (!cached?.fields?.length) return false;

			clearedPdfBlobRef.current = cached.clearedBlob ?? null;
			if (cached.clearedBlob) {
				displayUrl = URL.createObjectURL(cached.clearedBlob);
				setClearedPdfUrl(displayUrl);
				setLeftView("cleared");
			} else {
				setClearedPdfUrl(null);
				setLeftView("source");
			}
			setFields(cached.fields);
			setPrepare({ kind: "ready" });
			return true;
		}

		queueMicrotask(() => {
			if (cancelled) return;
			setApprove({ kind: "idle" });
			setActiveFieldId(null);
			setHighlightApprove(false);
		});

		if (phase === "review" && hasPreparedFlow(pdfKey)) {
			queueMicrotask(() => {
				if (!cancelled) hydrateFromCache();
			});
			return () => {
				cancelled = true;
				revokeDisplayUrl();
			};
		}

		if (phase === "prepare") {
			clearFlow(pdfKey);
		}

		queueMicrotask(() => {
			if (cancelled) return;
			setPrepare({ kind: "loading", step: "clear" });
			setFields([]);
			setApprove({ kind: "idle" });
			setActiveFieldId(null);
			setLeftView("cleared");
			setHighlightApprove(false);
			revokeDisplayUrl();
			setClearedPdfUrl(null);
			clearedPdfBlobRef.current = null;
		});

		async function runPrepare() {
			if (!isMockMode) {
				try {
					const clearRes = await fetch("/api/form-clear", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ pdfKey }),
					});

					if (cancelled) return;

					if (clearRes.ok) {
						const blob = await clearRes.blob();
						clearedPdfBlobRef.current = blob;
						patchFlow(pdfKey, { clearedBlob: blob });
						displayUrl = URL.createObjectURL(blob);
						if (!cancelled) {
							setClearedPdfUrl(displayUrl);
							setLeftView("cleared");
						}
					}
				} catch {
					// show source PDF if clear fails
				}

				if (cancelled) return;

				if (!displayUrl && !cancelled) {
					setClearedPdfUrl(null);
					setLeftView("source");
				}
			} else {
				if (cancelled) return;
				setClearedPdfUrl(null);
				setLeftView("source");
			}

			setPrepare({ kind: "loading", step: "extract" });

			try {
				const extractRes = await fetch("/api/extract", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ pdfKey }),
				});

				if (cancelled) return;

				if (isMockMode) {
					setFields([]);
					setPrepare({ kind: "ready" });
					return;
				}

				let nextFields: Field[];
				if (!extractRes.ok) {
					nextFields = fallbackFields;
				} else {
					const data = (await extractRes.json()) as { fields?: Field[] };
					nextFields = data.fields?.length ? data.fields : fallbackFields;
				}

				patchFlow(pdfKey, { fields: nextFields });
				setFields(nextFields);
				setPrepare({ kind: "ready" });
			} catch {
				if (cancelled) return;
				const nextFields = isMockMode ? [] : fallbackFields;
				patchFlow(pdfKey, { fields: nextFields });
				setFields(nextFields);
				setPrepare({ kind: "ready" });
			}
		}

		runPrepare();

		return () => {
			cancelled = true;
			revokeDisplayUrl();
		};
	}, [pdfKey, phase, isMockMode]);

	function updateField(id: string, patch: Partial<Field>) {
		setFields((prev) => {
			const next = prev.map((f) =>
				f.id === id ? { ...f, ...patch, reviewed: true } : f,
			);
			patchFlow(pdfKey, { fields: next });
			return next;
		});
	}

	function focusApproveButton() {
		approveBarRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "center",
		});
		setHighlightApprove(true);
		if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
		highlightTimerRef.current = setTimeout(() => {
			setHighlightApprove(false);
			highlightTimerRef.current = null;
		}, 1800);
	}

	function goToFilledResult() {
		router.push(editableFormResultPath(pdfKey));
	}

	async function onApprove() {
		setApprove({ kind: "loading" });

		const fieldSlims = fields.map((f) => ({
			id: f.id,
			label: f.label,
			value: f.value,
			type: f.type,
		}));

		patchFlow(pdfKey, { fields });

		try {
			let res: Response;
			const clearedBlob = clearedPdfBlobRef.current;

			if (clearedBlob) {
				const fd = new FormData();
				fd.append("file", clearedBlob, "cleared.pdf");
				fd.append("fields", JSON.stringify(fieldSlims));
				fd.append("pdfKey", pdfKey);
				res = await fetch("/api/form-fill/pulse", { method: "POST", body: fd });
			} else {
				res = await fetch("/api/form-fill/pulse", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ pdfKey, fields: fieldSlims }),
				});
			}

			if (res.status === 202) {
				const { jobId } = (await res.json()) as { jobId: string };
				let delay = 3_000;
				while (true) {
					await new Promise<void>((r) => setTimeout(r, delay));
					const statusRes = await fetch(
						`/api/form-fill/status?jobId=${encodeURIComponent(jobId)}`,
					);
					const ctype = statusRes.headers.get("Content-Type") ?? "";
					if (ctype.includes("application/pdf")) {
						patchFlow(pdfKey, {
							filledBlob: await statusRes.blob(),
							prebakedFilledSrc: undefined,
						});
						goToFilledResult();
						return;
					}
					const data = (await statusRes.json()) as {
						status?: string;
						error?: string;
					};
					if (!statusRes.ok || data.error) {
						throw new Error(data.error ?? "fill job failed");
					}
					delay = Math.min(Math.round(delay * 1.5), 10_000);
				}
			}

			if (!res.ok) throw new Error(`pulse ${res.status}`);

			// Sync path: mock mode returns 200 with PDF binary directly
			patchFlow(pdfKey, {
				filledBlob: await res.blob(),
				prebakedFilledSrc: undefined,
			});
			goToFilledResult();
		} catch {
			setApprove({ kind: "error", message: "Fill failed" });
		}
	}

	function phaseNavLinks() {
		const item = (p: EditableFormPhase, label: string) => (
			<Link
				href={
					p === "prepare"
						? editableFormPreparePath(pdfKey)
						: p === "review"
							? editableFormReviewPath(pdfKey)
							: editableFormResultPath(pdfKey)
				}
				className={`hover:text-fg transition-colors ${phase === p ? "text-accent font-medium" : ""}`}
			>
				{label}
			</Link>
		);
		return (
			<div className="px-8 lg:px-16 py-1.5 border-b border-border/40 flex flex-wrap justify-center gap-x-3 gap-y-1 font-mono text-[9px] text-fg-dim uppercase tracking-wider">
				{item("prepare", "Prepare")}
				<span aria-hidden>·</span>
				{item("review", "Review")}
				<span aria-hidden>·</span>
				{item("result", "Result")}
			</div>
		);
	}

	function stepText() {
		if (phase === "result") {
			if (!resultFilledSrc) {
				return (
					<span className="text-fg-dim text-sm font-medium">
						No filled PDF in this session yet.{" "}
						<Link
							href={editableFormReviewPath(pdfKey)}
							className="text-accent underline font-bold hover:text-fg"
						>
							Open review
						</Link>{" "}
						and approve a fill first.
					</span>
				);
			}
			return (
				<span className="text-accent text-sm font-medium">
					3. Success! Compare{" "}
					<span className="underline font-bold">
						Original, Cleared, and Filled
					</span>{" "}
					PDFs. Switch to{" "}
					<span className="underline font-bold">split view</span> to compare
					side by side.
				</span>
			);
		}
		if (prepare.kind === "loading") {
			return (
				<span className="text-accent text-sm font-medium animate-pulse">
					Pulse is clearing the template and extracting field values…
				</span>
			);
		}
		if (phase === "prepare") {
			return (
				<span className="text-accent text-sm font-medium">
					1. Prepare · clearing the template and extracting fields. Sending you
					to review when ready.
				</span>
			);
		}
		if (isMockMode) {
			return (
				<span className="text-fg-dim text-sm font-medium">
					Test mode · original PDF on the left, /extract failed on the right.
				</span>
			);
		}
		if (approve.kind === "idle") {
			return (
				<span className="text-accent text-sm font-medium">
					2. Review the extracted fields on the right, make corrections, then
					click{" "}
					<button
						type="button"
						onClick={focusApproveButton}
						className="underline font-bold hover:text-fg focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent focus-visible:outline-offset-2"
					>
						Approve & fill PDF →
					</button>
				</span>
			);
		}
		if (approve.kind === "loading") {
			return (
				<span className="text-accent text-sm font-medium animate-pulse">
					Pulse is running form-fill to stamp your updated values onto the
					document...
				</span>
			);
		}
		return (
			<span className="text-danger text-sm font-medium">
				API call failed. Click the button to retry.
			</span>
		);
	}

	const sourcePdfSrc = ORIGINAL_PDF[pdfKey];
	const clearedPdfSrc = isMockMode ? null : clearedPdfUrl;
	const displayedPdfSrc = isMockMode
		? sourcePdfSrc
		: leftView === "source"
			? sourcePdfSrc
			: (clearedPdfSrc ?? sourcePdfSrc);
	const showingClearedPdf =
		!isMockMode && leftView === "cleared" && Boolean(clearedPdfSrc);
	const resultFilledSrcForView = isMockMode ? sourcePdfSrc : resultFilledSrc;
	const resultClearedSrcForView = isMockMode ? null : resultClearedSrc;

	return (
		<div className="w-full lg:flex-1 lg:min-h-0 lg:flex lg:flex-col">
			<AppHeader
				left={
					<Link
						href="/"
						className="font-mono text-xs text-fg-dim hover:text-fg transition-colors"
						aria-label="Back"
					>
						← back to templates
					</Link>
				}
				right={<RunpulseLink />}
			/>

			{phaseNavLinks()}

			<div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto bg-bg">
				<div className="px-8 lg:px-16 py-2 border-b border-border/60 text-center">
					{stepText()}
				</div>

				{phase === "result" ? (
					resultFilledSrcForView ? (
						<ResultWorkspace
							sourcePdfSrc={sourcePdfSrc}
							clearedPdfSrc={resultClearedSrcForView}
							filledPdfSrc={resultFilledSrcForView}
							onBackToEdit={() => router.push(editableFormReviewPath(pdfKey))}
						/>
					) : (
						<div className="px-8 lg:px-16 py-16 text-center text-fg-dim text-sm max-w-md mx-auto">
							Filled PDFs are kept in memory for this session after you approve.
							Use{" "}
							<Link
								href={editableFormReviewPath(pdfKey)}
								className="text-accent underline"
							>
								Review
							</Link>{" "}
							to run the flow, or open{" "}
							<Link
								href={editableFormPreparePath(pdfKey)}
								className="text-accent underline"
							>
								Prepare
							</Link>{" "}
							from the top.
						</div>
					)
				) : prepare.kind === "loading" ? (
					<PrepareScreen step={prepare.step} />
				) : phase === "prepare" ? (
					<div className="px-8 lg:px-16 py-16 text-center text-fg-dim text-sm font-mono">
						Opening review…
					</div>
				) : (
					<div className="px-8 lg:px-16 py-4 lg:py-6">
						<div className="grid grid-cols-2 gap-6 mb-2 flex-shrink-0">
							<div>
								<div className="flex items-center justify-between gap-3 mb-0.5">
									<div className="font-mono text-[10px] uppercase tracking-widest text-accent">
										{leftView === "source"
											? "PDF · original source"
											: showingClearedPdf
												? "PDF · cleared template"
												: "PDF · source template"}
									</div>
									{!isMockMode && (
										<div className="flex items-center gap-1 bg-bg border border-border/60 rounded-lg p-0.5 shadow-inner">
											<button
												type="button"
												onClick={() => setLeftView("source")}
												className={`font-mono text-[10px] px-3 py-1 rounded-md transition-all duration-200 ${
													leftView === "source"
														? "bg-accent text-bg font-medium shadow-sm"
														: "text-fg-dim hover:text-fg hover:bg-bg-elev-2"
												}`}
											>
												Original
											</button>
											<button
												type="button"
												onClick={() => setLeftView("cleared")}
												disabled={!clearedPdfSrc}
												className={`font-mono text-[10px] px-3 py-1 rounded-md transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
													leftView === "cleared"
														? "bg-accent text-bg font-medium shadow-sm"
														: "text-fg-dim hover:text-fg hover:bg-bg-elev-2"
												}`}
											>
												Cleared PDF
											</button>
										</div>
									)}
								</div>
								<div className="text-[11px] text-fg-dim">
									{isMockMode
										? "Test mode · showing the original PDF only."
										: leftView === "source"
											? "Original selected PDF before Pulse clears existing values."
											: showingClearedPdf
												? "Cleared PDF from Pulse /form/clear. Blank fields ready to fill."
												: "Source PDF shown while Pulse /form/clear is unavailable."}
								</div>
							</div>
							<div>
								<div className="font-mono text-[10px] uppercase tracking-widest text-accent mb-0.5">
									Editable form · extracted by Pulse
								</div>
								<div className="text-[11px] text-fg-dim">
									{isMockMode
										? "Editable HTML form from Pulse /extract."
										: "Field values parsed from the PDF via /extract. Edit any value before submitting."}
								</div>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-6 items-stretch">
							<div className="rounded-xl overflow-hidden border border-border flex flex-col min-h-0">
								<div className={`bg-bg-elev-2 ${PDF_VIEWER_FRAME_CLASS}`}>
									<PdfViewer src={displayedPdfSrc} />
								</div>
							</div>

							<div className="flex flex-col rounded-xl overflow-hidden border border-border">
								<div className="p-5 bg-bg-elev-2">
									{isMockMode ? (
										<HtmlExtractPlaceholder />
									) : (
										<PdfEditPane
											fields={fields}
											activeFieldId={activeFieldId}
											pdfKey={pdfKey}
											readOnly={approve.kind === "loading"}
											onSelectField={setActiveFieldId}
											onUpdateField={updateField}
										/>
									)}
								</div>
								<div className="border-t border-border bg-bg-elev flex-shrink-0">
									{!isMockMode && hasFilledResult && (
										<div className="px-4 pt-3 text-center">
											<Link
												href={editableFormResultPath(pdfKey)}
												className="font-mono text-[10px] text-accent underline hover:text-fg transition-colors"
											>
												View filled PDF results →
											</Link>
										</div>
									)}
									{isMockMode ? (
										<div className="px-4 py-4 text-center font-mono text-[10px] text-fg-dim uppercase tracking-wider">
											Approve disabled · /extract failed
										</div>
									) : (
										<ApproveBar
											state={approve}
											onApprove={onApprove}
											expectedMs={FILL_EXPECTED_MS}
											highlight={highlightApprove}
											containerRef={approveBarRef}
										/>
									)}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
