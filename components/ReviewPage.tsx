import type { EditableFormPhase } from "@/components/ReviewWorkspace";
import { ReviewWorkspace } from "@/components/ReviewWorkspace";
import type { PdfKey } from "@/lib/types";

interface Props {
	pdfKey: PdfKey;
	phase: EditableFormPhase;
}

export function ReviewPage({ pdfKey, phase }: Props) {
	return (
		<main className="min-h-screen lg:h-screen lg:overflow-hidden lg:flex lg:flex-col">
			<ReviewWorkspace pdfKey={pdfKey} phase={phase} />
		</main>
	);
}
