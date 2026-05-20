// lib/types.ts
export type ConfidenceTier = "high" | "mid" | "low";
export type PdfKey = "prior-auth" | "referral";
export type ExtractSource = "pulse" | "fallback";

export const PDF_TEMPLATES: PdfKey[] = ["prior-auth", "referral"];

export function parseTemplateParam(
	param: string | undefined | null,
): PdfKey | null {
	if (param === "prior-auth" || param === "referral") return param;
	return null;
}

export function editableFormHref(template: PdfKey): string {
	return `/editable-form/${template}/review`;
}

export interface Field {
	id: string;
	label: string;
	value: string;
	confidence: number; // 0-1
	tier: ConfidenceTier;
	source: "OCR" | "Layout" | "VLM" | "Checkbox";
	flag?: string;
	type: "text" | "checkbox";
	needsReview: boolean;
	reviewed: boolean;
}

// Hand-tuned input zone in PDF points (Letter page = 612 x 792).
export interface InputZone {
	fieldId: string;
	page: number; // 1-indexed
	x: number; // PDF points from left
	y: number; // PDF points from bottom (PDF coord origin is bottom-left)
	width: number;
	height: number;
	fontSize: number;
}

export function tierFromConfidence(c: number): ConfidenceTier {
	if (c >= 0.9) return "high";
	if (c >= 0.75) return "mid";
	return "low";
}
