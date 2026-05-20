import { notFound, redirect } from "next/navigation";
import { editableFormReviewPath } from "@/lib/editable-form-routes";
import { parseTemplateParam } from "@/lib/types";

export default async function Page({
	params,
}: {
	params: Promise<{ template: string }>;
}) {
	const { template } = await params;
	const pdfKey = parseTemplateParam(template);
	if (!pdfKey) notFound();

	redirect(editableFormReviewPath(pdfKey));
}
