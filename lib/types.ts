// lib/types.ts
type ConfidenceTier = "high" | "mid" | "low";
export type PdfKey = "prior-auth" | "referral";

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
