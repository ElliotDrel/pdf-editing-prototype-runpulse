import { notFound } from "next/navigation";
import { ReviewPage } from "@/components/ReviewPage";
import { parseTemplateParam } from "@/lib/types";

export default async function Page({
	params,
}: {
	params: Promise<{ template: string }>;
}) {
	const { template } = await params;
	const pdfKey = parseTemplateParam(template);
	if (!pdfKey) notFound();

	return <ReviewPage pdfKey={pdfKey} phase="review" />;
}
