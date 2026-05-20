// app/api/form-fill/pulse/route.ts

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { buildInstructions, fillForm } from "@/lib/pulse";
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

		const fields = body.fields;
		const pdfKey = (
			body.pdfKey === "referral" ? "referral" : "prior-auth"
		) as PdfKey;
		const filename =
			pdfKey === "referral" ? "sample-referral.pdf" : "sample-prior-auth.pdf";
		const pdfPath = resolve(process.cwd(), "public", filename);
		const rawPdf = new Uint8Array(readFileSync(pdfPath));

		const instructions = buildInstructions(fields);
		const filled = await fillForm(rawPdf, instructions, []);

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
