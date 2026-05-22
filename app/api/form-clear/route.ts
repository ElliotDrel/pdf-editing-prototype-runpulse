import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { clearForm } from "@/lib/pulse";
import {
	isPulseMockMode,
	MOCK_HEADERS,
	mockClearedPdf,
	mockDelay,
} from "@/lib/pulse-mock";
import type { PdfKey } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
	const body = (await req.json().catch(() => ({}))) as { pdfKey?: string };
	const pdfKey = (
		body.pdfKey === "referral" ? "referral" : "prior-auth"
	) as PdfKey;

	if (isPulseMockMode()) {
		await mockDelay();
		const pdf = mockClearedPdf(pdfKey);
		return new NextResponse(pdf as unknown as BodyInit, {
			status: 200,
			headers: {
				"Content-Type": "application/pdf",
				"X-Form-Fields": "[]",
				"X-Form-Id": "mock",
				...MOCK_HEADERS,
				"Cache-Control": "no-store",
			},
		});
	}

	const filename =
		pdfKey === "referral" ? "sample-referral.pdf" : "sample-prior-auth.pdf";

	try {
		const pdfPath = resolve(process.cwd(), "public", filename);
		const pdf = new Uint8Array(readFileSync(pdfPath));
		const result = await clearForm(pdf);

		return new NextResponse(result.pdf as unknown as BodyInit, {
			status: 200,
			headers: {
				"Content-Type": "application/pdf",
				"X-Form-Fields": JSON.stringify(result.formFields),
				"X-Form-Id": result.formId,
				"Cache-Control": "no-store",
			},
		});
	} catch (err) {
		console.error("form-clear route error:", err);
		return NextResponse.json({ error: "form clear failed" }, { status: 500 });
	}
}
