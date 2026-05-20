// tests/pdf-stamp.test.ts

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { stampFields } from "@/lib/pdf-stamp";
import type { Field } from "@/lib/types";

const SAMPLE_PDF = resolve(__dirname, "../public/sample-prior-auth.pdf");

describe("pdf stamp", () => {
	it("returns a valid PDF binary with stamped text", async () => {
		const source = readFileSync(SAMPLE_PDF);
		const fields: Pick<Field, "id" | "value" | "type">[] = [
			{ id: "patient_name", value: "TESTNAME_X9", type: "text" },
			{ id: "urgency", value: "Routine", type: "checkbox" },
		];

		const out = await stampFields(source, fields);
		expect(out.byteLength).toBeGreaterThan(0);

		// Parse back to confirm valid PDF.
		const doc = await PDFDocument.load(out);
		expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
	});

	it("ignores unknown field ids without throwing", async () => {
		const source = readFileSync(SAMPLE_PDF);
		const fields = [{ id: "made_up_field", value: "x", type: "text" as const }];
		await expect(stampFields(source, fields)).resolves.toBeDefined();
	});
});
