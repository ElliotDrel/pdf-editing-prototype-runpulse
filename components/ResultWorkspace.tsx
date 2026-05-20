"use client";

import { type ReactNode, useState } from "react";
import { PDF_VIEWER_FRAME_CLASS } from "@/lib/pdf-viewer-layout";
import { PdfViewer } from "./PdfViewer";

type PdfVariant = "source" | "cleared" | "filled";
type ResultLayout = "single" | "split";

interface Props {
	sourcePdfSrc: string;
	clearedPdfSrc: string | null;
	filledPdfSrc: string;
	onBackToEdit: () => void;
}

function ToggleButton({
	active,
	disabled,
	onClick,
	children,
}: {
	active: boolean;
	disabled?: boolean;
	onClick: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onClick}
			className={`font-mono text-[10px] px-3 py-1.5 rounded-md transition-all duration-200 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40 ${
				active
					? "bg-accent text-bg font-medium shadow-sm"
					: "text-fg-dim hover:text-fg hover:bg-bg-elev-2"
			}`}
		>
			{children}
		</button>
	);
}

function PdfStage({
	label,
	description,
	src,
}: {
	label: string;
	description: string;
	src: string;
}) {
	return (
		<div className="flex flex-col min-h-0 flex-1">
			<div className="mb-2 flex-shrink-0">
				<div className="font-mono text-[10px] uppercase tracking-widest text-accent">
					{label}
				</div>
				<div className="text-[11px] text-fg-dim mt-0.5">{description}</div>
			</div>
			<div
				className={`rounded-xl overflow-hidden border border-border bg-bg-elev-2 ${PDF_VIEWER_FRAME_CLASS}`}
			>
				<PdfViewer src={src} />
			</div>
		</div>
	);
}

export function ResultWorkspace({
	sourcePdfSrc,
	clearedPdfSrc,
	filledPdfSrc,
	onBackToEdit,
}: Props) {
	const [layout, setLayout] = useState<ResultLayout>("single");
	const [activePdf, setActivePdf] = useState<PdfVariant>("filled");

	const clearedAvailable = Boolean(clearedPdfSrc);
	const leftSplitPdf: PdfVariant =
		activePdf === "source" || activePdf === "cleared" ? activePdf : "cleared";

	function selectPdf(variant: PdfVariant) {
		if (variant === "cleared" && !clearedAvailable) return;
		if (layout === "split" && variant === "filled") {
			setLayout("single");
		}
		setActivePdf(variant);
	}

	function selectLayout(next: ResultLayout) {
		setLayout(next);
		if (next === "split" && activePdf === "filled") {
			setActivePdf(clearedAvailable ? "cleared" : "source");
		}
	}

	const pdfSrc = (variant: PdfVariant) => {
		if (variant === "filled") return filledPdfSrc;
		if (variant === "source") return sourcePdfSrc;
		return clearedPdfSrc ?? sourcePdfSrc;
	};

	const singleMeta: Record<PdfVariant, { label: string; description: string }> =
		{
			source: {
				label: "PDF · original source",
				description:
					"Original selected PDF before Pulse clears existing values.",
			},
			cleared: {
				label: "PDF · cleared template",
				description: clearedAvailable
					? "Cleared PDF from Pulse /form/clear. Blank fields ready to fill."
					: "Source PDF shown while Pulse /form/clear is unavailable.",
			},
			filled: {
				label: "PDF · filled by Pulse",
				description: "Final document stamped with your reviewed field values.",
			},
		};

	return (
		<div className="px-8 lg:px-16 py-4 lg:py-6 flex flex-col min-h-0 flex-1">
			<div className="flex flex-wrap items-center justify-center gap-2 mb-4 flex-shrink-0">
				<div className="flex items-center gap-1 bg-bg border border-border/60 rounded-lg p-0.5 shadow-inner">
					<ToggleButton
						active={activePdf === "source"}
						onClick={() => selectPdf("source")}
					>
						Original
					</ToggleButton>
					<ToggleButton
						active={activePdf === "cleared"}
						disabled={!clearedAvailable}
						onClick={() => selectPdf("cleared")}
					>
						Cleared PDF
					</ToggleButton>
					<ToggleButton
						active={activePdf === "filled"}
						onClick={() => selectPdf("filled")}
					>
						Filled PDF
					</ToggleButton>
				</div>

				<div className="flex items-center gap-1 bg-bg border border-border/60 rounded-lg p-0.5 shadow-inner">
					<ToggleButton
						active={layout === "single"}
						onClick={() => selectLayout("single")}
					>
						Single view
					</ToggleButton>
					<ToggleButton
						active={layout === "split"}
						onClick={() => selectLayout("split")}
					>
						Split view
					</ToggleButton>
				</div>

				<button
					type="button"
					onClick={onBackToEdit}
					className="font-mono text-[10px] px-3 py-1.5 rounded-md border border-border/60 text-fg-dim hover:text-fg hover:bg-bg-elev-2 transition-colors whitespace-nowrap"
				>
					Back to edit fields
				</button>

				<a
					href={filledPdfSrc}
					download="pulse_filled.pdf"
					className="font-mono text-[10px] px-3 py-1.5 rounded-md bg-accent text-bg hover:bg-accent/90 transition-colors whitespace-nowrap"
				>
					Download ↓
				</a>
			</div>

			{layout === "single" ? (
				<PdfStage
					label={singleMeta[activePdf].label}
					description={singleMeta[activePdf].description}
					src={pdfSrc(activePdf)}
				/>
			) : (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
					<PdfStage
						label={
							leftSplitPdf === "source"
								? "PDF · original source"
								: clearedAvailable
									? "PDF · cleared template"
									: "PDF · source template"
						}
						description={
							leftSplitPdf === "source"
								? "Compare against the original selected PDF."
								: clearedAvailable
									? "Compare against the cleared blank template."
									: "Source PDF shown while Pulse /form/clear is unavailable."
						}
						src={pdfSrc(leftSplitPdf)}
					/>
					<PdfStage
						label="PDF · filled by Pulse"
						description="Final document stamped with your reviewed field values."
						src={filledPdfSrc}
					/>
				</div>
			)}
		</div>
	);
}
