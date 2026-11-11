'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  Heart,
  MessageSquare,
  MessageSquarePlus,
  Sparkles,
} from 'lucide-react';
import { useCommunityFeed, useCommunityTopics } from '../../hooks/useCommunity';

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}`;
  } catch {
    return '';
  }
}

export default function CommunityTeaser() {
  const { data: topics = [] } = useCommunityTopics();
  const { data: feedData, isLoading } = useCommunityFeed();

  // Get first 3 recent posts
  const recentPosts = feedData?.pages?.[0]?.items?.slice(0, 3) || [];

  return (
    <section className="border-b border-[#111111] bg-[#F6F5F0]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#111111] mb-8">
          <div>
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#6E6D68] mb-2 font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span>03 / Diễn đàn sinh viên</span>
            </div>
            <h2 className="font-editorial text-2xl sm:text-4xl lg:text-5xl text-[#111111] font-semibold leading-tight">
              Hỏi đáp & Thảo luận
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#5A5955] max-w-xl leading-relaxed">
              Cùng nhau chuẩn bị Aufnahmetest, gỡ rối hồ sơ APS, chia sẻ kinh nghiệm phỏng vấn visa và tìm nhà ở tại Đức.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/community"
              className="px-5 py-3 bg-[#111111] text-[#F6F5F0] text-xs font-mono uppercase tracking-[0.14em] hover:opacity-85 transition-opacity inline-flex items-center gap-2 group cursor-pointer"
            >
              <span>Vào diễn đàn</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Hot Topics Pills Carousel / Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 text-xs scrollbar-none">
          <span className="text-[11px] font-mono uppercase text-[#6E6D68] shrink-0 mr-1">
            Chủ đề nóng:
          </span>
          {topics.length > 0 ? (
            topics.map((t) => (
              <Link
                key={t.id}
                href={`/community?topic=${t.slug}`}
                className="px-3 py-1.5 border border-[#111111] bg-[#EFECE6] text-[#111111] font-mono text-[11px] hover:bg-[#111111] hover:text-[#F6F5F0] transition-colors whitespace-nowrap shrink-0"
              >
                #{t.name}
              </Link>
            ))
          ) : (
            <>
              <Link
                href="/community?topic=hoi-dap-aufnahmetest"
                className="px-3 py-1.5 border border-[#111111] bg-[#EFECE6] text-[#111111] font-mono text-[11px] hover:bg-[#111111] hover:text-[#F6F5F0] transition-colors whitespace-nowrap"
              >
                #Aufnahmetest
              </Link>
              <Link
                href="/community?topic=visa-thu-tuc-aps"
                className="px-3 py-1.5 border border-[#111111] bg-[#EFECE6] text-[#111111] font-mono text-[11px] hover:bg-[#111111] hover:text-[#F6F5F0] transition-colors whitespace-nowrap"
              >
                #Visa & APS
              </Link>
              <Link
                href="/community?topic=kinh-nghiem-chon-truong"
                className="px-3 py-1.5 border border-[#111111] bg-[#EFECE6] text-[#111111] font-mono text-[11px] hover:bg-[#111111] hover:text-[#F6F5F0] transition-colors whitespace-nowrap"
              >
                #Kinh nghiệm chọn trường
              </Link>
              <Link
                href="/community?topic=cuoc-song-nha-o-tai-duc"
                className="px-3 py-1.5 border border-[#111111] bg-[#EFECE6] text-[#111111] font-mono text-[11px] hover:bg-[#111111] hover:text-[#F6F5F0] transition-colors whitespace-nowrap"
              >
                #Nhà ở & Cuộc sống
              </Link>
            </>
          )}
        </div>

        {/* Live Discussion Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 border border-[#111111] bg-[#EFECE6]/50 animate-pulse h-48 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-3 w-20 bg-[#D6D4CC]"></div>
                  <div className="h-4 w-3/4 bg-[#D6D4CC]"></div>
                  <div className="h-3 w-full bg-[#D6D4CC]"></div>
                </div>
                <div className="h-3 w-16 bg-[#D6D4CC]"></div>
              </div>
            ))
          ) : recentPosts.length > 0 ? (
            recentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/community?topic=${post.topic?.slug || ''}`}
                className="p-6 border border-[#111111] bg-[#F6F5F0] hover:bg-[#EFECE6] transition-all flex flex-col justify-between group hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#6E6D68] pb-3 border-b border-[#EAE7DF] mb-3">
                    <span className="font-mono text-[10px] uppercase text-[#111111] font-medium px-1.5 py-0.5 bg-[#EAE7DF] border border-[#111111]">
                      {post.topic ? `#${post.topic.name}` : '#Chung'}
                    </span>
                    <span className="text-[11px] font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(post.createdAt)}
                    </span>
                  </div>

                  {post.title && (
                    <h3 className="font-editorial text-base sm:text-lg text-[#111111] font-semibold mb-2 line-clamp-2 group-hover:underline decoration-1 underline-offset-3">
                      {post.title}
                    </h3>
                  )}

                  <p className="text-xs text-[#5A5955] line-clamp-3 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#EAE7DF] text-xs font-mono text-[#6E6D68]">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />
                      {post.likesCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {post.commentsCount}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#111111] group-hover:translate-x-0.5 transition-transform">
                    Xem thảo luận →
                  </span>
                </div>
              </Link>
            ))
          ) : (
            /* Starter Prompts when database has few posts yet */
            [
              {
                topic: 'Aufnahmetest',
                slug: 'hoi-dap-aufnahmetest',
                title: 'Kinh nghiệm luyện đề Toán & Đức thi STK',
                desc: 'Chia sẻ đề mẫu và các dạng bài thường gặp tại các trường STK München, Nordhausen, Karlsruhe, Darmstadt...',
              },
              {
                topic: 'Visa & APS',
                slug: 'visa-thu-tuc-aps',
                title: 'Hồ sơ thẩm tra APS & Đặt lịch hẹn Visa',
                desc: 'Hỏi đáp về cách chuẩn bị học bạ, công chứng dịch thuật, mở tài khoản phong tỏa và thời gian chờ cấp visa.',
              },
              {
                topic: 'Cuộc sống tại Đức',
                slug: 'cuoc-song-nha-o-tai-duc',
                title: 'Tìm ký túc xá Studentenwerk & Thuê phòng WG',
                desc: 'Mẹo đăng ký KTX sớm, cách viết thư ứng tuyển WG-Gesucht và thủ tục đăng ký thường trú (Anmeldung).',
              },
            ].map((card, i) => (
              <Link
                key={i}
                href={`/community?topic=${card.slug}`}
                className="p-6 border border-[#111111] bg-[#F6F5F0] hover:bg-[#EFECE6] transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#6E6D68] pb-3 border-b border-[#EAE7DF] mb-3">
                    <span className="font-mono text-[10px] uppercase text-[#111111] font-medium px-1.5 py-0.5 bg-[#EAE7DF] border border-[#111111]">
                      #{card.topic}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.5">
                      Chủ đề hot
                    </span>
                  </div>

                  <h3 className="font-editorial text-base sm:text-lg text-[#111111] font-semibold mb-2 group-hover:underline underline-offset-3">
                    {card.title}
                  </h3>

                  <p className="text-xs text-[#5A5955] leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#EAE7DF] text-xs font-mono text-[#111111]">
                  <span className="flex items-center gap-1.5">
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    <span>Tham gia hỏi đáp</span>
                  </span>
                  <span>→</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
