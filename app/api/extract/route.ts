// app/api/extract/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { extractFields } from '@/lib/pulse';
import { zonesForPdf } from '@/lib/input-zones';
import { SAMPLE_FIELDS } from '@/lib/sample-data';
import { REFERRAL_FIELDS } from '@/lib/referral-data';
import { tierFromConfidence } from '@/lib/types';
import type { Field, PdfKey, ExtractSource } from '@/lib/types';
import type { PulseTextBlock } from '@/lib/pulse';
import { readCacheJson, writeCacheJson } from '@/lib/api-cache';

export const runtime = 'nodejs';
export const maxDuration = 60;

const PAGE_W = 612;
const PAGE_H = 792;

// Pulse bbox: [x1,y1, x2,y2, x3,y3, x4,y4] top-left origin, normalized 0-1
// Zone: PDF points, bottom-left origin
function zoneToPulseNorm(zone: { x: number; y: number; width: number; height: number }) {
  const x1 = zone.x / PAGE_W;
  const y1 = 1 - (zone.y + zone.height) / PAGE_H;
  const x2 = (zone.x + zone.width) / PAGE_W;
  const y2 = 1 - zone.y / PAGE_H;
  return { cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 };
}

function findBestBlock(blocks: PulseTextBlock[], zone: { x: number; y: number; width: number; height: number; page: number }): PulseTextBlock | null {
  const { cx: zx, cy: zy } = zoneToPulseNorm(zone);
  let best: PulseTextBlock | null = null;
  let bestDist = 0.18;

  for (const b of blocks) {
    if (b.page_number !== zone.page) continue;
    const bb = b.bounding_box;
    const bx = (bb[0] + bb[4]) / 2;
    const by = (bb[1] + bb[5]) / 2;
    const dist = Math.sqrt((bx - zx) ** 2 + (by - zy) ** 2);
    if (dist < bestDist) {
      bestDist = dist;
      best = b;
    }
  }
  return best;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { pdfKey?: string };
  const pdfKey = (body.pdfKey === 'referral' ? 'referral' : 'prior-auth') as PdfKey;

  const filename = pdfKey === 'referral' ? 'sample-referral.pdf' : 'sample-prior-auth.pdf';
  const fallbackFields = pdfKey === 'referral' ? REFERRAL_FIELDS : SAMPLE_FIELDS;

  // Return cached extract result if available
  const cached = readCacheJson<{ fields: Field[]; source: ExtractSource }>(`extract-${pdfKey}.json`);
  if (cached) {
    console.log(`extract: cache hit for ${pdfKey}`);
    return NextResponse.json(cached);
  }

  try {
    const pdfPath = resolve(process.cwd(), 'public', filename);
    const pdf = new Uint8Array(readFileSync(pdfPath));

    const extracted = await extractFields(pdf);
    const textBlocks = extracted.Text ?? [];

    if (textBlocks.length === 0) {
      return NextResponse.json({ fields: fallbackFields, source: 'fallback' as ExtractSource });
    }

    const zones = zonesForPdf(pdfKey);
    const fields: Field[] = zones.map((zone) => {
      const fallback = fallbackFields.find((f) => f.id === zone.fieldId)!;
      const block = findBestBlock(textBlocks, { ...zone });

      if (!block) return fallback;

      const confidence = block.average_word_confidence ?? fallback.confidence;
      const tier = tierFromConfidence(confidence);
      return {
        ...fallback,
        value: block.content?.trim() || fallback.value,
        confidence,
        tier,
        needsReview: tier !== 'high',
        reviewed: tier === 'high',
      };
    });

    const result = { fields, source: 'pulse' as ExtractSource };
    writeCacheJson(`extract-${pdfKey}.json`, result);
    return NextResponse.json(result);
  } catch (err) {
    console.error('extract route error:', err);
    return NextResponse.json({ fields: fallbackFields, source: 'fallback' as ExtractSource });
  }
}
