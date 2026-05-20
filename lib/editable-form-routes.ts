import type { PdfKey } from "./types";

export function editableFormPreparePath(pdfKey: PdfKey): string {
	return `/editable-form/${pdfKey}/prepare`;
}

export function editableFormReviewPath(pdfKey: PdfKey): string {
	return `/editable-form/${pdfKey}/review`;
}

export function editableFormResultPath(pdfKey: PdfKey): string {
	return `/editable-form/${pdfKey}/result`;
}
