// lib/types.ts
export type ConfidenceTier = 'high' | 'mid' | 'low';

export interface Field {
  id: string;
  label: string;
  value: string;
  confidence: number;        // 0-1
  tier: ConfidenceTier;
  source: 'OCR' | 'Layout' | 'VLM' | 'Checkbox';
  flag?: string;
  type: 'text' | 'checkbox';
  needsReview: boolean;
  reviewed: boolean;
}

// Pulse normalized bbox: [x0, y0, x1, y1] in 0-1 page coords.
export type NormalizedBBox = [number, number, number, number];

// Hand-tuned input zone in PDF points (Letter page = 612 x 792).
export interface InputZone {
  fieldId: string;
  page: number;     // 1-indexed
  x: number;        // PDF points from left
  y: number;        // PDF points from bottom (PDF coord origin is bottom-left)
  width: number;
  height: number;
  fontSize: number;
}

export function tierFromConfidence(c: number): ConfidenceTier {
  if (c >= 0.90) return 'high';
  if (c >= 0.75) return 'mid';
  return 'low';
}
