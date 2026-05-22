import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { zonesForPdf } from "@/lib/input-zones";
import { extractFields, type PulseTextBlock } from "@/lib/pulse";
import { isPulseMockMode, MOCK_HEADERS, mockDelay } from "@/lib/pulse-mock";
import { REFERRAL_FIELDS } from "@/lib/referral-data";
import { SAMPLE_FIELDS } from "@/lib/sample-data";
import type { ExtractSource, Field, PdfKey } from "@/lib/types";
import { tierFromConfidence } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const PAGE_W = 612;
const PAGE_H = 792;

function zoneToPulseNorm(zone: {
	x: number;
	y: number;
	width: number;
	height: number;
}) {
	const x1 = zone.x / PAGE_W;
	const y1 = 1 - (zone.y + zone.height) / PAGE_H;
	const x2 = (zone.x + zone.width) / PAGE_W;
	const y2 = 1 - zone.y / PAGE_H;
	return { cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 };
}

function findBestBlock(
	blocks: PulseTextBlock[],
	zone: { x: number; y: number; width: number; height: number; page: number },
): PulseTextBlock | null {
	const { cx: zx, cy: zy } = zoneToPulseNorm(zone);
	let best: PulseTextBlock | null = null;
	let bestDist = 0.18;

	for (const b of blocks) {
		if (b.page_number !== zone.page) continue;
		const bb = b.bounding_box;
		if (bb.length < 6) continue;
		const [x0, y0, , , x4, y4] = bb;
		if (
			x0 === undefined ||
			y0 === undefined ||
			x4 === undefined ||
			y4 === undefined
		) {
			continue;
		}
		const bx = (x0 + x4) / 2;
		const by = (y0 + y4) / 2;
		const dist = Math.sqrt((bx - zx) ** 2 + (by - zy) ** 2);
		if (dist < bestDist) {
			bestDist = dist;
			best = b;
		}
	}
	return best;
}

export async function POST(req: NextRequest) {
	const body = (await req.json().catch(() => ({}))) as { pdfKey?: string };
	const pdfKey = (
		body.pdfKey === "referral" ? "referral" : "prior-auth"
	) as PdfKey;

	if (isPulseMockMode()) {
		await mockDelay();
		return NextResponse.json(
			{ error: "extract unavailable in test mode" },
			{ status: 503, headers: MOCK_HEADERS },
		);
	}

	const filename =
		pdfKey === "referral" ? "sample-referral.pdf" : "sample-prior-auth.pdf";
	const fallbackFields =
		pdfKey === "referral" ? REFERRAL_FIELDS : SAMPLE_FIELDS;

	try {
		const pdfPath = resolve(process.cwd(), "public", filename);
		const pdf = new Uint8Array(readFileSync(pdfPath));

		const extracted = await extractFields(pdf);
		const textBlocks = extracted.Text ?? [];

		if (textBlocks.length === 0) {
			return NextResponse.json({
				fields: fallbackFields,
				source: "fallback" as ExtractSource,
			});
		}

		const zones = zonesForPdf(pdfKey);
		const fields: Field[] = zones.flatMap((zone) => {
			const fallback = fallbackFields.find((f) => f.id === zone.fieldId);
			if (!fallback) return [];
			const block = findBestBlock(textBlocks, { ...zone });

			if (!block) return [fallback];

			const confidence = block.average_word_confidence ?? fallback.confidence;
			const tier = tierFromConfidence(confidence);
			return [
				{
					...fallback,
					value: block.content?.trim() || fallback.value,
					confidence,
					tier,
					needsReview: tier !== "high",
					reviewed: tier === "high",
				},
			];
		});

		return NextResponse.json({
			fields,
			source: "pulse" as ExtractSource,
		});
	} catch (err) {
		console.error("extract route error:", err);
		return NextResponse.json({
			fields: fallbackFields,
			source: "fallback" as ExtractSource,
		});
	}
}
