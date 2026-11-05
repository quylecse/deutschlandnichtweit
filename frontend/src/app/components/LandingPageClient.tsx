'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { Studienkolleg } from '../types/studienkolleg';
import { formatValue } from '../lib/studienkollegs';
import StudienkollegTable from './StudienkollegTable';
import SiteFooter from './SiteFooter';

interface Props {
  schools: Studienkolleg[];
}

const KURSE_COMPASS = [
  {
    code: 'T-Kurs',
    short: 'T',
    name: 'Kỹ thuật & Tự nhiên',
    subjects: 'Tiếng Đức · Toán · Vật lý / Hóa học',
    majors: 'Công nghệ thông tin, Cơ khí, Điện tử, Xây dựng, Toán, Vật lý',
    city: 'TU München & KIT Karlsruhe',
    image:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=85',
  },
  {
    code: 'M-Kurs',
    short: 'M',
    name: 'Y khoa, Dược & Sinh học',
    subjects: 'Tiếng Đức · Sinh học · Hóa học / Vật lý / Toán',
    majors: 'Y đa khoa, Nha khoa, Dược học, Công nghệ sinh học, Tâm lý học',
    city: 'Charité Berlin & Uni Heidelberg',
    image:
      'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1400&q=85',
  },
  {
    code: 'W-Kurs',
    short: 'W',
    name: 'Kinh tế & Quản trị',
    subjects: 'Tiếng Đức · Toán · Kinh tế / Tiếng Anh',
    majors: 'Quản trị kinh doanh (BWL), Kinh tế học (VWL), Tài chính, Logistics',
    city: 'Goethe-Universität Frankfurt',
    image:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=85',
  },
  {
    code: 'G-Kurs',
    short: 'G',
    name: 'Nhân văn, Luật & Xã hội',
    subjects: 'Tiếng Đức · Lịch sử · Văn học / Xã hội',
    majors: 'Luật học, Báo chí, Truyền thông, Triết học, Lịch sử, Chính trị học',
    city: 'Humboldt-Universität zu Berlin',
    image:
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1400&q=85',
  },
  {
    code: 'S-Kurs',
    short: 'S',
    name: 'Ngôn ngữ & Dịch thuật',
    subjects: 'Tiếng Đức · Ngoại ngữ hai · Ngữ văn',
    majors: 'Ngôn ngữ Anh/Pháp/Tây Ban Nha, Biên phiên dịch, Sư phạm ngoại ngữ',
    city: 'Universität Leipzig & Heidelberg',
    image:
      'https://images.unsplash.com/photo-1507842229356-51c61504d3ab?auto=format&fit=crop&w=1400&q=85',
  },
];

const ROADMAP_STEPS = [
  {
    step: '01',
    title: 'APS & Tiếng Đức B1/B2',
    detail: 'Thẩm định học thuật APS tại Việt Nam và hoàn thành chứng chỉ Goethe, Telc hoặc TestDaF.',
  },
  {
    step: '02',
    title: 'Xin Zulassung dự thi',
    detail: 'Nộp hồ sơ qua Uni-Assist hoặc cổng riêng của trường trước hạn kỳ Hè (15.01) / kỳ Đông (15.07).',
  },
  {
    step: '03',
    title: 'Thi Aufnahmetest tại Đức',
    detail: 'Làm bài thi trực tiếp gồm tiếng Đức (C-Test) và môn chuyên ngành tương ứng với khối đã chọn.',
  },
  {
    step: '04',
    title: '2 học kỳ & Kỳ thi FSP',
    detail: 'Hoàn thành chương trình dự bị 1 năm và thi Feststellungsprüfung (FSP) để vào đại học.',
  },
];

export default function LandingPageClient({ schools }: Props) {
  const [activeKursIdx, setActiveKursIdx] = useState(0);
  const [tableCourseFilter, setTableCourseFilter] = useState('ALL');
  const [times, setTimes] = useState<{ vn: string; de: string }>({
    vn: '--:--',
    de: '--:--',
  });

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const vn = now.toLocaleTimeString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
      });
      const de = now.toLocaleTimeString('vi-VN', {
        timeZone: 'Europe/Berlin',
        hour: '2-digit',
        minute: '2-digit',
      });
      setTimes({ vn, de });
    };
    updateClock();
    const timer = setInterval(updateClock, 15000);
    return () => clearInterval(timer);
  }, []);

  const currentKurs = KURSE_COMPASS[activeKursIdx];

  const handleFilterByKurs = (kursCode: string) => {
    setTableCourseFilter(kursCode);
    const el = document.getElementById('bangtracuu');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F5F0] text-[#111111]">
      {/* Minimalist Masthead */}
      <header className="sticky top-0 z-40 bg-[#F6F5F0]/95 backdrop-blur-xs border-b border-[#111111]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 h-14 flex items-center justify-between text-xs">
          <a href="#" className="font-semibold tracking-[0.12em] uppercase">
            Deutschland.Nicht.Weit
          </a>

          <span className="hidden sm:inline-block text-[#6E6D68]">
            Hà Nội {times.vn} · Berlin {times.de}
          </span>

          <Link
            href="/studienkollegs"
            className="inline-flex items-center gap-1 text-[#111111] hover:opacity-60 transition-opacity uppercase tracking-wider"
          >
            <span>Bảng toàn màn hình</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* HERO + INTERACTIVE COURSE COMPASS */}
      <section className="max-w-[1440px] mx-auto border-b border-[#111111]">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Statement + Interactive Compass */}
          <div className="lg:col-span-7 px-4 sm:px-8 lg:px-12 py-12 sm:py-16 flex flex-col justify-between lg:border-r border-[#111111]">
            <div>
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-[#6E6D68] pb-5 border-b border-[#D6D4CC] mb-8 animate-reveal">
                <span>Studienkolleg · Aufnahmetest · FSP</span>
                <span>2026 / 2027</span>
              </div>

              <h1 className="font-editorial text-6xl sm:text-7xl xl:text-[5.5rem] leading-[0.98] tracking-[-0.02em] text-[#111111] animate-reveal-delay-1">
                <span className="block">Nước Đức</span>
                <span className="block italic font-normal text-[#4A4944] mt-1">
                  không còn xa.
                </span>
              </h1>

              <p className="mt-6 text-base sm:text-[17px] text-[#3D3C38] max-w-xl leading-relaxed animate-reveal-delay-2">
                Lịch thi Aufnahmetest, hạn nộp hồ sơ và đề mẫu từ các trường Studienkolleg trên toàn
                nước Đức.
              </p>
            </div>

            {/* Interactive Course Compass inside Hero */}
            <div className="mt-12 pt-8 border-t border-[#111111] animate-reveal-delay-3">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.15em] text-[#6E6D68] mb-3">
                <span>La bàn chọn khối dự bị</span>
                <span>0{activeKursIdx + 1} / 05</span>
              </div>

              {/* 5 Tactile Kurs Buttons */}
              <div className="grid grid-cols-5 border border-[#111111] divide-x divide-[#111111] bg-[#F6F5F0]">
                {KURSE_COMPASS.map((item, idx) => {
                  const active = idx === activeKursIdx;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onMouseEnter={() => setActiveKursIdx(idx)}
                      onClick={() => setActiveKursIdx(idx)}
                      className={`py-3 px-2 text-left transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#111111] text-[#F6F5F0]'
                          : 'hover:bg-[#EAE7DF] text-[#111111]'
                      }`}
                    >
                      <span className="font-editorial text-2xl sm:text-3xl block leading-none">
                        {item.short}
                      </span>
                      <span
                        className={`text-[10px] uppercase tracking-wider mt-1.5 block truncate ${
                          active ? 'text-[#C8C5BC]' : 'text-[#6E6D68]'
                        }`}
                      >
                        {item.code}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Kurs Blueprint Details */}
              <div className="border-x border-b border-[#111111] bg-[#EFECE6] p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="font-editorial text-2xl text-[#111111]">
                    {currentKurs.code} — {currentKurs.name}
                  </h2>
                  <p className="text-xs text-[#5A5955]">
                    <strong className="text-[#111111] font-medium">Môn thi:</strong>{' '}
                    {currentKurs.subjects}
                  </p>
                  <p className="text-xs text-[#5A5955]">
                    <strong className="text-[#111111] font-medium">Ngành đại học:</strong>{' '}
                    {currentKurs.majors}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleFilterByKurs(currentKurs.code)}
                  className="shrink-0 inline-flex items-center gap-2 bg-[#111111] text-[#F6F5F0] px-4 py-2.5 text-xs uppercase tracking-wider hover:opacity-85 transition-opacity cursor-pointer"
                >
                  <span>Lọc {currentKurs.code}</span>
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Visual Frame */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-[#EFECE6] p-4 sm:p-8">
            <div className="flex items-center justify-between text-xs text-[#5A5955] mb-3">
              <span className="uppercase tracking-wider">{currentKurs.code}</span>
              <span>{currentKurs.city}</span>
            </div>

            <div className="relative aspect-[4/5] w-full overflow-hidden border border-[#111111] bg-[#111111]">
              {KURSE_COMPASS.map((item, index) => (
                <img
                  key={item.code}
                  src={item.image}
                  alt={item.name}
                  className={`absolute inset-0 w-full h-full object-cover grayscale contrast-110 transition-all duration-700 ease-out ${
                    index === activeKursIdx
                      ? 'opacity-95 scale-100'
                      : 'opacity-0 scale-105 pointer-events-none'
                  }`}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/80 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-[#F6F5F0] flex items-end justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[#C8C5BC] block mb-1">
                    Định hướng chuyên ngành
                  </span>
                  <p className="font-editorial text-2xl leading-snug">{currentKurs.name}</p>
                </div>
                <span className="font-editorial text-4xl italic opacity-80">
                  {currentKurs.short}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#D6D4CC] flex items-center justify-between text-xs text-[#5A5955]">
              <span>2 kỳ tuyển sinh mỗi năm (Kỳ Hè & Kỳ Đông)</span>
              <a
                href="#bangtracuu"
                className="text-[#111111] underline underline-offset-4 hover:opacity-60"
              >
                Xem toàn bộ trường ↓
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE TICKER */}
      <div className="border-b border-[#111111] bg-[#EFECE6] overflow-hidden py-3">
        <div className="animate-marquee text-xs uppercase tracking-[0.1em] text-[#111111]">
          {[...schools, ...schools].slice(0, 24).map((s, idx) => {
            const dateStr = formatValue(s.entrance_exam_info?.exam_date_raw, 'Đang cập nhật');
            return (
              <Link
                key={`${s.id}-${idx}`}
                href={`/studienkollegs/${s.slug || s.id}`}
                className="inline-flex items-center gap-3 px-8 border-r border-[#C8C5BC] hover:opacity-60 transition-opacity whitespace-nowrap"
              >
                <span className="text-[#6E6D68]">{s.city}</span>
                <span className="font-semibold">{s.name}</span>
                <span className="text-[#5A5955]">[{dateStr}]</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* CONCISE 4-STEP ROADMAP STRIP */}
      <section className="max-w-[1440px] mx-auto border-b border-[#111111]">
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#111111]">
          {ROADMAP_STEPS.map((item) => (
            <div
              key={item.step}
              className="p-6 sm:p-8 bg-[#F6F5F0] hover:bg-[#EFECE6] transition-colors flex flex-col justify-between"
            >
              <div className="flex items-baseline justify-between mb-4">
                <span className="font-editorial text-3xl text-[#111111]">{item.step}.</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-[#6E6D68]">
                  Cột mốc
                </span>
              </div>
              <div>
                <h3 className="font-editorial text-2xl text-[#111111] mb-2">{item.title}</h3>
                <p className="text-xs text-[#5A5955] leading-relaxed">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DIRECTORY TABLE */}
      <section
        id="bangtracuu"
        className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-14 sm:py-20"
      >
        <StudienkollegTable
          schools={schools}
          showHeader={true}
          initialCourse={tableCourseFilter}
        />
      </section>

      {/* FOOTER */}
      <SiteFooter />
    </div>
  );
}
