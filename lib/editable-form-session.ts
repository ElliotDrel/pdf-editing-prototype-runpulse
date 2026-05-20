import type { PdfKey } from "./types";

const PREFIX = "runpulse:v1:";

function filledKey(pdfKey: PdfKey): string {
	return `${PREFIX}filled:${pdfKey}`;
}

function clearedKey(pdfKey: PdfKey): string {
	return `${PREFIX}cleared:${pdfKey}`;
}

export function setSessionFilledPdf(pdfKey: PdfKey, url: string): void {
	if (typeof window === "undefined") return;
	sessionStorage.setItem(filledKey(pdfKey), url);
}

export function getSessionFilledPdf(pdfKey: PdfKey): string | null {
	if (typeof window === "undefined") return null;
	return sessionStorage.getItem(filledKey(pdfKey));
}

export function setSessionClearedPdf(pdfKey: PdfKey, url: string): void {
	if (typeof window === "undefined") return;
	sessionStorage.setItem(clearedKey(pdfKey), url);
}

export function getSessionClearedPdf(pdfKey: PdfKey): string | null {
	if (typeof window === "undefined") return null;
	return sessionStorage.getItem(clearedKey(pdfKey));
}
