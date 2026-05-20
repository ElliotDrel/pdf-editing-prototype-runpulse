import { AppHeader, RunpulseLink } from '@/components/AppHeader';
import { PdfSelector } from '@/components/PdfSelector';

export default function Page() {
  return (
    <main className="min-h-screen lg:h-screen lg:overflow-hidden lg:flex lg:flex-col">
      <AppHeader
        left={
          <span className="text-accent text-sm font-medium">
            1. Select a PDF template to start
          </span>
        }
        right={<RunpulseLink />}
      />
      <PdfSelector />
    </main>
  );
}
