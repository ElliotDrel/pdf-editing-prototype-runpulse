import { Header } from '@/components/Header';
import { Demo } from '@/components/Demo';
import { Memo } from '@/components/Memo';
import { Footer } from '@/components/Footer';

export default function Page() {
  return (
    <main>
      <div className="max-w-[720px] mx-auto px-6 pt-14 pb-4">
        <Header />
      </div>
      <Demo />
      <div className="max-w-[720px] mx-auto px-6 pt-12 pb-20">
        <Memo />
        <Footer />
      </div>
    </main>
  );
}
