import { Suspense } from 'react';
import { getStudienkollegs } from './lib/studienkollegs';
import LandingPageClient from './components/LandingPageClient';

async function HomeContent() {
  const schools = await getStudienkollegs();
  return <LandingPageClient schools={schools} />;
}

function HomeFallback() {
  return (
    <div className="min-h-screen bg-[#F6F5F0] text-[#111111] flex items-center justify-center p-8">
      <div className="text-xs uppercase tracking-[0.18em] text-[#6E6D68] animate-pulse">
        Đang tải dữ liệu Studienkolleg...
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent />
    </Suspense>
  );
}
