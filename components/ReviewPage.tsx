import { ReviewWorkspace } from '@/components/ReviewWorkspace';
import type { PdfKey } from '@/lib/types';

interface Props {
  pdfKey: PdfKey;
}

export function ReviewPage({ pdfKey }: Props) {
  return (
    <main className="min-h-screen lg:h-screen lg:overflow-hidden lg:flex lg:flex-col">
      <ReviewWorkspace pdfKey={pdfKey} />
    </main>
  );
}
