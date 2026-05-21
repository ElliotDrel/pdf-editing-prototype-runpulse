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

const PDF_META: Record<PdfVariant, { label: string; description: string }> = {
	source: {
		label: "PDF · original source",
		description: "Original selected PDF before Pulse clears existing values.",
	},
	cleared: {
		label: "PDF · cleared template",
		description:
			"Cleared PDF from Pulse /form/clear. Blank fields ready to fill.",
	},
	filled: {
		label: "PDF · filled by Pulse",
		description: "Final document stamped with your reviewed field values.",
	},
};

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

function PdfVariantToggle({
	value,
	clearedAvailable,
	onChange,
}: {
	value: PdfVariant;
	clearedAvailable: boolean;
	onChange: (variant: PdfVariant) => void;
}) {
	return (
		<div className="flex items-center gap-1 bg-bg border border-border/60 rounded-lg p-0.5 shadow-inner flex-shrink-0">
			<ToggleButton active={value === "source"} onClick={() => onChange("source")}>
				Original
			</ToggleButton>
			<ToggleButton
				active={value === "cleared"}
				disabled={!clearedAvailable}
				onClick={() => onChange("cleared")}
			>
				Cleared PDF
			</ToggleButton>
			<ToggleButton active={value === "filled"} onClick={() => onChange("filled")}>
				Filled PDF
			</ToggleButton>
		</div>
	);
}

function PdfStage({
	variant,
	clearedAvailable,
	src,
	showToggle,
	onVariantChange,
}: {
	variant: PdfVariant;
	clearedAvailable: boolean;
	src: string;
	showToggle: boolean;
	onVariantChange: (variant: PdfVariant) => void;
}) {
	const meta = PDF_META[variant];
	const description =
		variant === "cleared" && !clearedAvailable
			? "Source PDF shown while Pulse /form/clear is unavailable."
			: meta.description;

	return (
		<div className="flex flex-col min-h-0 flex-1">
			<div className="mb-2 flex-shrink-0 flex flex-col gap-1.5">
				<div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
					<div className="font-mono text-[10px] uppercase tracking-widest text-accent min-w-0 shrink">
						{meta.label}
					</div>
					{showToggle && (
						<PdfVariantToggle
							value={variant}
							clearedAvailable={clearedAvailable}
							onChange={onVariantChange}
						/>
					)}
				</div>
				<div className="text-[11px] text-fg-dim">{description}</div>
			</div>
			<div
				className={`rounded-xl overflow-hidden border border-border bg-bg-elev-2 ${PDF_VIEWER_FRAME_CLASS}`}
			>
				<PdfViewer src={src} />
			</div>
		</div>
	);
}

function defaultSplitLeft(activePdf: PdfVariant, clearedAvailable: boolean): PdfVariant {
	if (activePdf !== "filled") return activePdf;
	return clearedAvailable ? "cleared" : "source";
}

export function ResultWorkspace({
	sourcePdfSrc,
	clearedPdfSrc,
	filledPdfSrc,
	onBackToEdit,
}: Props) {
	const [layout, setLayout] = useState<ResultLayout>("single");
	const [activePdf, setActivePdf] = useState<PdfVariant>("filled");
	const [leftPanelPdf, setLeftPanelPdf] = useState<PdfVariant>("cleared");
	const [rightPanelPdf, setRightPanelPdf] = useState<PdfVariant>("filled");

	const clearedAvailable = Boolean(clearedPdfSrc);

	function selectPdf(variant: PdfVariant) {
		if (variant === "cleared" && !clearedAvailable) return;
		setActivePdf(variant);
	}

	function selectPanelPdf(
		side: "left" | "right",
		variant: PdfVariant,
	) {
		if (variant === "cleared" && !clearedAvailable) return;
		if (side === "left") setLeftPanelPdf(variant);
		else setRightPanelPdf(variant);
	}

	function selectLayout(next: ResultLayout) {
		if (next === "split") {
			setLeftPanelPdf(defaultSplitLeft(activePdf, clearedAvailable));
			setRightPanelPdf("filled");
		}
		setLayout(next);
	}

	const pdfSrc = (variant: PdfVariant) => {
		if (variant === "filled") return filledPdfSrc;
		if (variant === "source") return sourcePdfSrc;
		return clearedPdfSrc ?? sourcePdfSrc;
	};

	return (
		<div className="px-8 lg:px-16 py-4 lg:py-6 flex flex-col min-h-0 flex-1">
			<div className="flex flex-wrap items-center justify-center gap-2 mb-4 flex-shrink-0">
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
					variant={activePdf}
					clearedAvailable={clearedAvailable}
					src={pdfSrc(activePdf)}
					showToggle
					onVariantChange={selectPdf}
				/>
			) : (
				<div className="grid grid-cols-2 gap-4 sm:gap-6 flex-1 min-h-0 min-w-0">
					<PdfStage
						variant={leftPanelPdf}
						clearedAvailable={clearedAvailable}
						src={pdfSrc(leftPanelPdf)}
						showToggle
						onVariantChange={(variant) => selectPanelPdf("left", variant)}
					/>
					<PdfStage
						variant={rightPanelPdf}
						clearedAvailable={clearedAvailable}
						src={pdfSrc(rightPanelPdf)}
						showToggle
						onVariantChange={(variant) => selectPanelPdf("right", variant)}
					/>
				</div>
			)}
		</div>
	);
}
