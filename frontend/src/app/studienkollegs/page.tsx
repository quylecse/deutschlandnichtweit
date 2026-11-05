import { Suspense } from 'react';
import Link from 'next/link';
import { getStudienkollegs } from '../lib/studienkollegs';
import StudienkollegTable from '../components/StudienkollegTable';
import SiteFooter from '../components/SiteFooter';

export const metadata = {
  title: 'Bảng tra cứu Studienkolleg — Deutschland.Nicht.Weit',
  description: 'Tra cứu toàn bộ các trường Studienkolleg tại Đức.',
};

async function DirectoryTableContent() {
  const schools = await getStudienkollegs();
  return <StudienkollegTable schools={schools} showHeader={true} />;
}

function TableFallback() {
  return (
    <div className="border border-[#111111] p-12 text-center text-xs uppercase tracking-[0.16em] text-[#6E6D68] animate-pulse">
      Đang tải danh sách trường...
    </div>
  );
}

export default function StudienkollegsDirectoryPage() {
  return (
    <div className="min-h-screen bg-[#F6F5F0] text-[#111111] flex flex-col justify-between">
      <div>
        <header className="border-b border-[#111111] px-4 sm:px-8 lg:px-12 py-4 flex items-center justify-between text-xs">
          <Link href="/" className="font-semibold tracking-[0.12em] uppercase hover:opacity-60">
            Deutschland.Nicht.Weit
          </Link>

          <Link href="/" className="text-[#6E6D68] hover:text-[#111111] uppercase tracking-wider">
            ← Trang chủ
          </Link>
        </header>

        <main className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-14">
          <Suspense fallback={<TableFallback />}>
            <DirectoryTableContent />
          </Suspense>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
