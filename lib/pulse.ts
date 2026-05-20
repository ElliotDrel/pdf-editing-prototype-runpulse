const BASE_URL = process.env.PULSE_BASE_URL ?? "https://api.runpulse.com";

export interface FillCell {
	text?: string;
	bounding_box?: number[];
	page_number?: number;
	type?: "text" | "checkbox";
	checkbox_details?: Array<{
		selected: boolean;
		text: string;
		center_coord?: number[];
	}>;
	[k: string]: unknown;
}

export async function fillForm(
	pdf: Uint8Array,
	instructions: string,
	formFields: FillCell[],
): Promise<Uint8Array> {
	const apiKey = process.env.PULSE_API_KEY;
	if (!apiKey) throw new Error("PULSE_API_KEY not set");

	const fd = new FormData();
	fd.append(
		"file",
		new Blob([pdf as BlobPart], { type: "application/pdf" }),
		"sample.pdf",
	);
	fd.append("instructions", instructions);
	if (formFields.length > 0) {
		fd.append("form_fields", JSON.stringify(formFields));
	}

	const res = await fetch(`${BASE_URL}/form/fill`, {
		method: "POST",
		headers: { "x-api-key": apiKey },
		body: fd,
	});
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new Error(`pulse /form/fill failed: ${res.status} ${detail}`);
	}

	const ctype = res.headers.get("Content-Type") ?? "";
	if (ctype.includes("application/json")) {
		const body = (await res.json()) as { pdf_url?: string };
		if (!body.pdf_url) throw new Error("pulse response missing pdf_url");
		const pdfRes = await fetch(body.pdf_url, {
			headers: { "x-api-key": apiKey },
		});
		if (!pdfRes.ok)
			throw new Error(`pulse pdf_url fetch failed: ${pdfRes.status}`);
		return new Uint8Array(await pdfRes.arrayBuffer());
	}
	return new Uint8Array(await res.arrayBuffer());
}

export function buildInstructions(
	fields: Array<{ label: string; value: string; type: string }>,
): string {
	const lines = fields.map((f) => {
		if (f.type === "checkbox") {
			return `${f.label}: ${f.value} box checked.`;
		}
		return `${f.label}: ${f.value}.`;
	});
	return `Fill out this form with:\n${lines.join("\n")}`;
}
