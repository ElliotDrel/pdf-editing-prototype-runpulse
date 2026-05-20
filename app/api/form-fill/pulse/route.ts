import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import {
	isPulseMockMode,
	mockDelay,
	mockFilledPdf,
	mockFillDelayMs,
	MOCK_HEADERS,
} from "@/lib/pulse-mock";
import { buildInstructions, clearForm, fillForm } from "@/lib/pulse";
import type { PdfKey } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type FieldSlim = {
	id: string;
	label: string;
	value: string;
	type: "text" | "checkbox";
};

export async function POST(req: NextRequest) {
	try {
		if (isPulseMockMode()) {
			await mockDelay(mockFillDelayMs());
			const filled = mockFilledPdf();
			return new NextResponse(filled as unknown as BodyInit, {
				status: 200,
				headers: {
					"Content-Type": "application/pdf",
					"Content-Disposition": 'attachment; filename="pulse_render.pdf"',
					...MOCK_HEADERS,
					"Cache-Control": "no-store",
				},
			});
		}

		const ct = req.headers.get("content-type") ?? "";
		let sourcePdf: Uint8Array;
		let fields: FieldSlim[];

		if (ct.includes("multipart/form-data")) {
			const fd = await req.formData();
			const file = fd.get("file") as File | null;
			const fieldsJson = fd.get("fields") as string | null;
			if (!file || !fieldsJson) {
				return NextResponse.json(
					{ error: "missing file or fields" },
					{ status: 400 },
				);
			}
			sourcePdf = new Uint8Array(await file.arrayBuffer());
			fields = JSON.parse(fieldsJson) as FieldSlim[];
		} else {
			const body = (await req.json()) as {
				fields?: FieldSlim[];
				pdfKey?: string;
			};
			if (!Array.isArray(body.fields)) {
				return NextResponse.json(
					{ error: "fields must be array" },
					{ status: 400 },
				);
			}
			fields = body.fields;
			const pdfKey = (
				body.pdfKey === "referral" ? "referral" : "prior-auth"
			) as PdfKey;
			const filename =
				pdfKey === "referral" ? "sample-referral.pdf" : "sample-prior-auth.pdf";
			const pdfPath = resolve(process.cwd(), "public", filename);
			const rawPdf = new Uint8Array(readFileSync(pdfPath));
			const cleared = await clearForm(rawPdf);
			sourcePdf = cleared.pdf;
		}

		const instructions = buildInstructions(fields);
		const filled = await fillForm(sourcePdf, instructions, []);

		return new NextResponse(filled as unknown as BodyInit, {
			status: 200,
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": 'attachment; filename="pulse_render.pdf"',
				"Cache-Control": "no-store",
			},
		});
	} catch (err) {
		console.error("pulse route error:", err);
		return NextResponse.json({ error: "pulse fill failed" }, { status: 500 });
	}
}
