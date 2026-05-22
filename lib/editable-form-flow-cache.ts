import type { Field, PdfKey } from "./types";

export type FlowArtifacts = {
	clearedBlob?: Blob;
	filledBlob?: Blob;
	/** Static path when Pulse fill failed and pre-baked PDF is used. */
	prebakedFilledSrc?: string;
	fields?: Field[];
};

const cache = new Map<PdfKey, FlowArtifacts>();
const fillListeners = new Set<(pdfKey: PdfKey) => void>();

export function onFillStored(fn: (pdfKey: PdfKey) => void): () => void {
	fillListeners.add(fn);
	return () => fillListeners.delete(fn);
}

export function clearFlow(pdfKey: PdfKey): void {
	cache.delete(pdfKey);
}

export function getFlow(pdfKey: PdfKey): FlowArtifacts | undefined {
	return cache.get(pdfKey);
}

export function patchFlow(pdfKey: PdfKey, patch: Partial<FlowArtifacts>): void {
	cache.set(pdfKey, { ...cache.get(pdfKey), ...patch });
	if (patch.filledBlob !== undefined) {
		fillListeners.forEach((fn) => fn(pdfKey));
	}
}

export function hasFilledPdf(pdfKey: PdfKey): boolean {
	const flow = cache.get(pdfKey);
	return Boolean(flow?.filledBlob || flow?.prebakedFilledSrc);
}

export function hasPreparedFlow(pdfKey: PdfKey): boolean {
	const flow = cache.get(pdfKey);
	return Boolean(flow?.fields?.length);
}
