// lib/types.ts
export type ConfidenceTier = 'high' | 'mid' | 'low';
export type PdfKey = 'prior-auth' | 'referral';
export type ExtractSource = 'pulse' | 'fallback';

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

export type RenderBlockType = 'Text' | 'Title' | 'Header' | 'Footer';

export interface RenderBlock {
  content: string;
  bbox: number[]; // [x1,y1,x2,y2,x3,y3,x4,y4] normalized 0-1, top-left origin
  page: number;
  blockType: RenderBlockType;
}
