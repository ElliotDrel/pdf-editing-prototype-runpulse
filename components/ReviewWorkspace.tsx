// components/ReviewWorkspace.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { REFERRAL_FIELDS } from "@/lib/referral-data";
import { SAMPLE_FIELDS } from "@/lib/sample-data";
import type { Field, PdfKey } from "@/lib/types";
import { AppHeader, RunpulseLink } from "./AppHeader";
import { ApproveBar } from "./ApproveBar";
import { PdfEditPane } from "./PdfEditPane";
import { PdfViewer } from "./PdfViewer";

export type ApproveState =
	| { kind: "idle" }
	| { kind: "loading" }
	| { kind: "done"; pulseUrl: string; pulseIsPrebaked?: boolean }
	| { kind: "error"; message: string };

type LeftView = "original" | "filled";

const PDF_SRC: Record<PdfKey, string> = {
	"prior-auth": "/sample-prior-auth.pdf",
	referral: "/sample-referral.pdf",
};

const FILL_EXPECTED_MS = 60_000;

interface Props {
	pdfKey: PdfKey;
}

export function ReviewWorkspace({ pdfKey }: Props) {
	const [fields, setFields] = useState<Field[]>([]);
	const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
	const [approve, setApprove] = useState<ApproveState>({ kind: "idle" });
	const [leftView, setLeftView] = useState<LeftView>("original");

	// Initialize fields on mount or when pdfKey changes
	useEffect(() => {
		setFields(pdfKey === "referral" ? REFERRAL_FIELDS : SAMPLE_FIELDS);
		setApprove({ kind: "idle" });
		setActiveFieldId(null);
		setLeftView("original");
	}, [pdfKey]);

	useEffect(() => {
		if (approve.kind === "done") setLeftView("filled");
	}, [approve.kind]);

	function updateField(id: string, patch: Partial<Field>) {
		setFields((prev) =>
			prev.map((f) => (f.id === id ? { ...f, ...patch, reviewed: true } : f)),
		);
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
			const res = await fetch("/api/form-fill/pulse", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ pdfKey, fields: fieldSlims }),
			});

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
		if (approve.kind === "idle") {
			return (
				<span className="text-accent text-sm font-medium">
					2. Review the extracted fields on the right, make corrections, then click{" "}
					<span className="underline font-bold">Approve & fill PDF →</span>
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
					3. Success! Use the <span className="underline font-bold">Filled / Original</span> toggles
					above the PDF to compare, or download the result.
				</span>
			);
		}
		return (
			<span className="text-danger text-sm font-medium">
				API call failed. Click the button to retry.
			</span>
		);
	}

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

				<div className="px-8 lg:px-16 py-4 lg:py-6">
				<div className="grid grid-cols-2 gap-6 mb-2 flex-shrink-0">
					<div>
						<div className="flex items-center justify-between gap-3 mb-0.5">
							<div className="font-mono text-[10px] uppercase tracking-widest text-accent">
								{approve.kind === "done" && leftView === "filled"
									? "PDF · filled by Pulse"
									: "PDF · blank template"}
							</div>
							{approve.kind === "done" && (
								<div className="flex items-center gap-1 bg-bg border border-border/60 rounded-lg p-0.5 shadow-inner">
									<button
										type="button"
										onClick={() => setLeftView("filled")}
										className={`font-mono text-[10px] px-3 py-1 rounded-md transition-all duration-200 ${
											leftView === "filled"
												? "bg-accent text-bg font-medium shadow-sm"
												: "text-fg-dim hover:text-fg hover:bg-bg-elev-2"
										}`}
									>
										Filled PDF
									</button>
									<button
										type="button"
										onClick={() => setLeftView("original")}
										className={`font-mono text-[10px] px-3 py-1 rounded-md transition-all duration-200 ${
											leftView === "original"
												? "bg-accent text-bg font-medium shadow-sm"
												: "text-fg-dim hover:text-fg hover:bg-bg-elev-2"
										}`}
									>
										Original
									</button>
								</div>
							)}
						</div>
						<div className="text-[11px] text-fg-dim">
							Interactive document view. Shows the target PDF form.
						</div>
					</div>
					<div>
						<div className="font-mono text-[10px] uppercase tracking-widest text-accent mb-0.5">
							Editable form · extracted by Pulse
						</div>
						<div className="text-[11px] text-fg-dim">
							The structured fields parsed from the PDF. Edit any value before
							submitting.
						</div>
					</div>
				</div>
				<div className="grid grid-cols-2 gap-6 items-stretch">
					<div className="rounded-xl overflow-hidden border border-border flex flex-col min-h-0">
						<div className="bg-bg-elev-2 flex-1 min-h-0">
							<PdfViewer
								src={
									leftView === "filled" && approve.kind === "done"
										? approve.pulseUrl
										: PDF_SRC[pdfKey]
								}
							/>
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
							<ApproveBar
								state={approve}
								onApprove={onApprove}
								expectedMs={FILL_EXPECTED_MS}
							/>
						</div>
					</div>
				</div>
				</div>
			</div>
		</div>
	);
}
