const BASE_URL = process.env.PULSE_BASE_URL ?? "https://api.runpulse.com";

export interface PulseTextBlock {
	content: string;
	bounding_box: number[];
	average_word_confidence: number;
	page_number: number;
}

export interface PulseExtractResponse {
	markdown?: string;
	extraction_id?: string;
	Text?: PulseTextBlock[];
	Title?: PulseTextBlock[];
	Header?: PulseTextBlock[];
	Footer?: PulseTextBlock[];
	[k: string]: unknown;
}

export async function extractFields(
	pdf: Uint8Array,
): Promise<PulseExtractResponse> {
	const apiKey = process.env.PULSE_API_KEY;
	if (!apiKey) throw new Error("PULSE_API_KEY not set");

	const fd = new FormData();
	fd.append(
		"file",
		new Blob([pdf as BlobPart], { type: "application/pdf" }),
		"document.pdf",
	);

	const res = await fetch(`${BASE_URL}/extract`, {
		method: "POST",
		headers: { "x-api-key": apiKey },
		body: fd,
	});
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new Error(`pulse /extract failed: ${res.status} ${detail}`);
	}
	return res.json() as Promise<PulseExtractResponse>;
}

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

export interface ClearResult {
	pdf: Uint8Array;
	formFields: FillCell[];
	formId: string;
}

export async function clearForm(pdf: Uint8Array): Promise<ClearResult> {
	const apiKey = process.env.PULSE_API_KEY;
	if (!apiKey) throw new Error("PULSE_API_KEY not set");

	const fd = new FormData();
	fd.append(
		"file",
		new Blob([pdf as BlobPart], { type: "application/pdf" }),
		"sample.pdf",
	);

	const res = await fetch(`${BASE_URL}/form/clear`, {
		method: "POST",
		headers: { "x-api-key": apiKey },
		body: fd,
	});
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new Error(`pulse /form/clear failed: ${res.status} ${detail}`);
	}

	const body = (await res.json()) as {
		pdf_url?: string;
		form_fields?: FillCell[];
		form_id?: string;
	};
	if (!body.pdf_url)
		throw new Error("pulse /form/clear response missing pdf_url");
	const pdfRes = await fetch(body.pdf_url, {
		headers: { "x-api-key": apiKey },
	});
	if (!pdfRes.ok)
		throw new Error(`pulse /form/clear pdf_url fetch failed: ${pdfRes.status}`);

	return {
		pdf: new Uint8Array(await pdfRes.arrayBuffer()),
		formFields: body.form_fields ?? [],
		formId: body.form_id ?? "",
	};
}

export async function submitFillAsync(
	pdf: Uint8Array,
	instructions: string,
	formFields: FillCell[],
): Promise<string> {
	const apiKey = process.env.PULSE_API_KEY;
	if (!apiKey) throw new Error("PULSE_API_KEY not set");

	const fd = new FormData();
	fd.append(
		"file",
		new Blob([pdf as BlobPart], { type: "application/pdf" }),
		"sample.pdf",
	);
	fd.append("instructions", instructions);
	fd.append("async", "true");
	if (formFields.length > 0) {
		fd.append("form_fields", JSON.stringify(formFields));
	}

	const res = await fetch(`${BASE_URL}/form/fill`, {
		method: "POST",
		headers: { "x-api-key": apiKey },
		body: fd,
	});

	if (res.status !== 202) {
		const detail = await res.text().catch(() => "");
		throw new Error(`pulse /form/fill async failed: ${res.status} ${detail}`);
	}

	const data = (await res.json()) as { job_id?: string };
	if (!data.job_id) throw new Error("pulse async response missing job_id");
	return data.job_id;
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
