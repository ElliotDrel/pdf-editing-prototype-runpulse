import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { readCacheBytes, writeCacheBytes, readCacheJson, writeCacheJson } from "@/lib/api-cache";
import {
	isPulseMockMode,
	mockClearedPdf,
	mockDelay,
	MOCK_HEADERS,
} from "@/lib/pulse-mock";
import { clearForm, type FillCell } from "@/lib/pulse";
import type { PdfKey } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
	const body = (await req.json().catch(() => ({}))) as { pdfKey?: string };
	const pdfKey = (body.pdfKey === "referral" ? "referral" : "prior-auth") as PdfKey;

	if (isPulseMockMode()) {
		await mockDelay();
		const pdf = mockClearedPdf(pdfKey);
		return new NextResponse(pdf as unknown as BodyInit, {
			status: 200,
			headers: {
				"Content-Type": "application/pdf",
				"X-Form-Fields": "[]",
				"X-Form-Id": "mock",
				"X-Cache": "mock",
				...MOCK_HEADERS,
				"Cache-Control": "no-store",
			},
		});
	}

	const filename =
		pdfKey === "referral" ? "sample-referral.pdf" : "sample-prior-auth.pdf";

	const pdfCacheKey = `clear-${pdfKey}.pdf`;
	const metaCacheKey = `clear-${pdfKey}.json`;

	try {
		const cachedPdf = readCacheBytes(pdfCacheKey);
		const cachedMeta = readCacheJson<{ formFields: FillCell[]; formId: string }>(
			metaCacheKey,
		);
		if (cachedPdf && cachedMeta) {
			return new NextResponse(cachedPdf as unknown as BodyInit, {
				status: 200,
				headers: {
					"Content-Type": "application/pdf",
					"X-Form-Fields": JSON.stringify(cachedMeta.formFields),
					"X-Form-Id": cachedMeta.formId,
					"X-Cache": "hit",
					"Cache-Control": "no-store",
				},
			});
		}

		const pdfPath = resolve(process.cwd(), "public", filename);
		const pdf = new Uint8Array(readFileSync(pdfPath));
		const result = await clearForm(pdf);

		writeCacheBytes(pdfCacheKey, result.pdf);
		writeCacheJson(metaCacheKey, {
			formFields: result.formFields,
			formId: result.formId,
		});

		return new NextResponse(result.pdf as unknown as BodyInit, {
			status: 200,
			headers: {
				"Content-Type": "application/pdf",
				"X-Form-Fields": JSON.stringify(result.formFields),
				"X-Form-Id": result.formId,
				"X-Cache": "miss",
				"Cache-Control": "no-store",
			},
		});
	} catch (err) {
		console.error("form-clear route error:", err);
		return NextResponse.json({ error: "form clear failed" }, { status: 500 });
	}
}
