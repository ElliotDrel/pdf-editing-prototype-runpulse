import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REFERRAL_FIELDS } from "@/lib/referral-data";
import { SAMPLE_FIELDS } from "@/lib/sample-data";
import type { Field, PdfKey } from "@/lib/types";

const MOCK_HEADERS = { "X-Pulse-Mock": "1" } as const;

const MOCK_SOURCE_FILE: Record<PdfKey, string> = {
	"prior-auth": "sample-prior-auth.pdf",
	referral: "sample-referral.pdf",
};

export function isPulseMockMode(): boolean {
	return process.env.PULSE_MOCK_MODE === "1";
}

function parseDelay(value: string | undefined, fallback: number): number {
	const parsed = Number(value ?? fallback);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function mockDelayMs(): number {
	return parseDelay(process.env.PULSE_MOCK_DELAY_MS, 1500);
}

export function mockFillDelayMs(): number {
	return parseDelay(process.env.PULSE_MOCK_FILL_DELAY_MS, 3000);
}

export async function mockDelay(ms?: number): Promise<void> {
	const wait = ms ?? mockDelayMs();
	if (wait <= 0) return;
	await new Promise((resolveDelay) => setTimeout(resolveDelay, wait));
}

function publicPath(filename: string): string {
	return resolve(process.cwd(), "public", filename);
}

function readMockPdf(filename: string): Uint8Array {
	return new Uint8Array(readFileSync(publicPath(filename)));
}

function mockSourcePdf(pdfKey: PdfKey): Uint8Array {
	return readMockPdf(MOCK_SOURCE_FILE[pdfKey]);
}

export function mockClearedPdf(pdfKey: PdfKey): Uint8Array {
	return mockSourcePdf(pdfKey);
}

export function mockFilledPdf(pdfKey: PdfKey): Uint8Array {
	return mockSourcePdf(pdfKey);
}

export function mockExtractFields(pdfKey: PdfKey): Field[] {
	return pdfKey === "referral" ? REFERRAL_FIELDS : SAMPLE_FIELDS;
}

export { MOCK_HEADERS };
