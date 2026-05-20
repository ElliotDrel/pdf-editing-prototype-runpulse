// components/ReviewWorkspace.tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { REFERRAL_FIELDS } from "@/lib/referral-data";
import { SAMPLE_FIELDS } from "@/lib/sample-data";
import type { Field, PdfKey } from "@/lib/types";
import { AppHeader, RunpulseLink } from "./AppHeader";
import { ApproveBar } from "./ApproveBar";
import { PdfEditPane } from "./PdfEditPane";
import { PdfViewer } from "./PdfViewer";
import { PrepareScreen, type PrepareStep } from "./PrepareScreen";
import { ResultWorkspace } from "./ResultWorkspace";

export type ApproveState =
	| { kind: "idle" }
	| { kind: "loading" }
	| { kind: "done"; pulseUrl: string; pulseIsPrebaked?: boolean }
	| { kind: "error"; message: string };

type LeftView = "source" | "cleared" | "filled";

type PrepareState = { kind: "loading"; step: PrepareStep } | { kind: "ready" };
type WorkspaceMode = "edit" | "result";

const FALLBACK_CLEARED: Partial<Record<PdfKey, string>> = {
	referral: "/sample-referral-cleared.pdf",
};

const ORIGINAL_PDF: Record<PdfKey, string> = {
	"prior-auth": "/sample-prior-auth.pdf",
	referral: "/sample-referral.pdf",
};

const FILL_EXPECTED_MS = 90_000;

interface Props {
	pdfKey: PdfKey;
}

export function ReviewWorkspace({ pdfKey }: Props) {
	const [prepare, setPrepare] = useState<PrepareState>({ kind: "loading", step: "clear" });
	const [fields, setFields] = useState<Field[]>([]);
	const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
	const [approve, setApprove] = useState<ApproveState>({ kind: "idle" });
	const [leftView, setLeftView] = useState<LeftView>("cleared");
	const [clearedPdfUrl, setClearedPdfUrl] = useState<string | null>(null);
	const [highlightApprove, setHighlightApprove] = useState(false);
	const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("edit");
	const clearedPdfBlobRef = useRef<Blob | null>(null);
	const clearedPdfUrlRef = useRef<string | null>(null);
	const approveBarRef = useRef<HTMLDivElement | null>(null);
	const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (approve.kind === "done") {
			queueMicrotask(() => {
				setLeftView("filled");
				setWorkspaceMode("result");
			});
		}
	}, [approve.kind]);

	useEffect(() => {
		return () => {
			if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
		};
	}, []);

	useEffect(() => {
		let cancelled = false;
		const fallbackFields = pdfKey === "referral" ? REFERRAL_FIELDS : SAMPLE_FIELDS;

		queueMicrotask(() => {
			if (cancelled) return;
			setPrepare({ kind: "loading", step: "clear" });
			setFields([]);
			setApprove({ kind: "idle" });
			setActiveFieldId(null);
			setLeftView("cleared");
			setHighlightApprove(false);
			setWorkspaceMode("edit");
		});

		if (clearedPdfUrlRef.current) {
			URL.revokeObjectURL(clearedPdfUrlRef.current);
			clearedPdfUrlRef.current = null;
		}
		clearedPdfBlobRef.current = null;
		queueMicrotask(() => {
			if (!cancelled) setClearedPdfUrl(null);
		});

		async function runPrepare() {
			let clearedUrl = FALLBACK_CLEARED[pdfKey] ?? null;

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
					clearedUrl = URL.createObjectURL(blob);
					clearedPdfUrlRef.current = clearedUrl;
				}
			} catch {
				// fall through to static cleared PDF or blank template fallback
			}

			if (cancelled) return;

			setClearedPdfUrl(clearedUrl);
			setLeftView(clearedUrl ? "cleared" : "source");
			setPrepare({ kind: "loading", step: "extract" });

			try {
				const extractRes = await fetch("/api/extract", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ pdfKey }),
				});

				if (cancelled) return;

				const data = extractRes.ok
					? ((await extractRes.json()) as { fields?: Field[] })
					: { fields: fallbackFields };

				setFields(data.fields?.length ? data.fields : fallbackFields);
				setPrepare({ kind: "ready" });
			} catch {
				if (cancelled) return;
				setFields(fallbackFields);
				setPrepare({ kind: "ready" });
			}
		}

		runPrepare();

		return () => {
			cancelled = true;
			if (clearedPdfUrlRef.current) {
				URL.revokeObjectURL(clearedPdfUrlRef.current);
				clearedPdfUrlRef.current = null;
			}
		};
	}, [pdfKey]);

	function updateField(id: string, patch: Partial<Field>) {
		setFields((prev) =>
			prev.map((f) => (f.id === id ? { ...f, ...patch, reviewed: true } : f)),
		);
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

	async function onApprove() {
		setApprove({ kind: "loading" });

		const fieldSlims = fields.map((f) => ({
			id: f.id,
			label: f.label,
			value: f.value,
			type: f.type,
		}));

		try {
			let res: Response;
			const clearedBlob = clearedPdfBlobRef.current;

			if (clearedBlob) {
				const fd = new FormData();
				fd.append("file", clearedBlob, "cleared.pdf");
				fd.append("fields", JSON.stringify(fieldSlims));
				res = await fetch("/api/form-fill/pulse", { method: "POST", body: fd });
			} else {
				res = await fetch("/api/form-fill/pulse", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ pdfKey, fields: fieldSlims }),
				});
			}

			if (!res.ok) throw new Error(`pulse ${res.status}`);
			const pulseUrl = URL.createObjectURL(await res.blob());
			setApprove({ kind: "done", pulseUrl });
		} catch {
			setApprove({
				kind: "done",
				pulseUrl: "/prebaked-pulse-fill.pdf",
				pulseIsPrebaked: true,
			});
		}
	}

	function stepText() {
		if (prepare.kind === "loading") {
			return (
				<span className="text-accent text-sm font-medium animate-pulse">
					Pulse is clearing the template and extracting field values…
				</span>
			);
		}
		if (approve.kind === "idle") {
			return (
				<span className="text-accent text-sm font-medium">
					2. Review the extracted fields on the right, make corrections, then click{" "}
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
					Pulse is running form-fill to stamp your updated values onto the document...
				</span>
			);
		}
		if (approve.kind === "done") {
			return (
				<span className="text-accent text-sm font-medium">
					3. Success! Compare{" "}
					<span className="underline font-bold">Original, Cleared, and Filled</span> PDFs. Switch to{" "}
					<span className="underline font-bold">split view</span> to compare side by side.
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
	const clearedPdfSrc = clearedPdfUrl;
	const displayedPdfSrc =
		leftView === "source" ? sourcePdfSrc : (clearedPdfSrc ?? sourcePdfSrc);
	const showingClearedPdf = leftView === "cleared" && Boolean(clearedPdfSrc);
	const showResultWorkspace = approve.kind === "done" && workspaceMode === "result";

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

			<div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto bg-bg">
				<div className="px-8 lg:px-16 py-2 border-b border-border/60 text-center">
					{stepText()}
				</div>

				{prepare.kind === "loading" ? (
					<PrepareScreen step={prepare.step} />
				) : showResultWorkspace ? (
					<ResultWorkspace
						sourcePdfSrc={sourcePdfSrc}
						clearedPdfSrc={clearedPdfSrc}
						filledPdfSrc={approve.pulseUrl}
						onBackToEdit={() => setWorkspaceMode("edit")}
					/>
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
								</div>
								<div className="text-[11px] text-fg-dim">
									{leftView === "source"
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
									Field values parsed from the PDF via /extract. Edit any value before submitting.
								</div>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-6 items-stretch">
							<div className="rounded-xl overflow-hidden border border-border flex flex-col min-h-0">
								<div className="bg-bg-elev-2 flex-1 min-h-[480px]">
									<PdfViewer src={displayedPdfSrc} />
								</div>
							</div>

							<div className="flex flex-col rounded-xl overflow-hidden border border-border">
								<div className="p-5 bg-bg-elev-2">
									<PdfEditPane
										fields={fields}
										activeFieldId={activeFieldId}
										pdfKey={pdfKey}
										onSelectField={setActiveFieldId}
										onUpdateField={updateField}
									/>
								</div>
								<div className="border-t border-border bg-bg-elev flex-shrink-0">
									{approve.kind === "done" && (
										<div className="px-4 pt-3 text-center">
											<button
												type="button"
												onClick={() => setWorkspaceMode("result")}
												className="font-mono text-[10px] text-accent underline hover:text-fg transition-colors"
											>
												View filled PDF results →
											</button>
										</div>
									)}
									<ApproveBar
										state={
											workspaceMode === "edit" && approve.kind === "done"
												? { kind: "idle" }
												: approve
										}
										onApprove={onApprove}
										expectedMs={FILL_EXPECTED_MS}
										highlight={highlightApprove}
										containerRef={approveBarRef}
									/>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
