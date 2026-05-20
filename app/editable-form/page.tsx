import { redirect } from 'next/navigation';
import { ReviewPage } from '@/components/ReviewPage';
import { parseTemplateParam } from '@/lib/types';

interface PageProps {
  searchParams: Promise<{ template?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { template } = await searchParams;
  const pdfKey = parseTemplateParam(template);

  if (!pdfKey) {
    redirect('/');
  }

  return <ReviewPage pdfKey={pdfKey} />;
}
