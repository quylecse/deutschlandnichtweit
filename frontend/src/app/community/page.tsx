'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, MessageSquarePlus, Sparkles } from 'lucide-react';
import SiteFooter from '../components/SiteFooter';
import TopicTabs from '../components/community/TopicTabs';
import CreatePostWidget from '../components/community/CreatePostWidget';
import PostCard from '../components/community/PostCard';
import {
  useCommunityFeed,
  useCommunityTopics,
} from '../hooks/useCommunity';
import { useAuthStore } from '../stores/useAuthStore';

function CommunityContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams?.get('topic') || '';
  const [selectedTopicSlug, setSelectedTopicSlug] = useState<string>(initialTopic);

  useEffect(() => {
    const topicFromUrl = searchParams?.get('topic');
    if (topicFromUrl !== null && topicFromUrl !== undefined) {
      setSelectedTopicSlug(topicFromUrl);
    }
  }, [searchParams]);

  const { data: topics = [] } = useCommunityTopics();

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommunityFeed(selectedTopicSlug || undefined);

  // Sentinel ref for Infinite Scroll IntersectionObserver
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all posts across pages
  const allPosts = data?.pages.flatMap((page) => page.items) || [];

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header Typography */}
      <div className="mb-8 border-b border-[#111111] pb-4">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#6E6D68] block mb-1">
          03 / Diễn đàn cộng đồng
        </span>
        <h1 className="font-editorial text-3xl sm:text-4xl text-[#111111] font-semibold">
          Hỏi đáp & Thảo luận
        </h1>
      </div>

      {/* Topics Filter Bar */}
      <TopicTabs
        topics={topics}
        selectedTopicSlug={selectedTopicSlug}
        onSelectTopic={setSelectedTopicSlug}
      />

      {/* Create Post Widget (Pinned at Top) */}
      <CreatePostWidget
        topics={topics}
        selectedTopicSlug={selectedTopicSlug}
      />

      {/* Infinite Scroll Feed */}
      {isLoading ? (
        <div className="py-16 text-center text-xs font-mono text-[#6E6D68] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-[#111111]" />
          <span>Đang tải các bài thảo luận...</span>
        </div>
      ) : isError ? (
        <div className="p-6 border border-[#111111] bg-[#FAF2EF] text-[#A32A15] text-xs text-center">
          Không thể tải bảng tin lúc này. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.
        </div>
      ) : allPosts.length === 0 ? (
        <div className="p-10 border border-[#111111] bg-[#EFECE6] text-center space-y-3">
          <MessageSquarePlus className="w-8 h-8 mx-auto text-[#6E6D68]" />
          <h3 className="font-editorial text-lg text-[#111111]">
            Chưa có bài thảo luận nào trong chủ đề này
          </h3>
          <p className="text-xs text-[#6E6D68] max-w-sm mx-auto">
            Hãy là người đầu tiên đặt câu hỏi hoặc chia sẻ thông tin hữu ích cho cộng đồng du học sinh!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {allPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              activeTopicSlug={selectedTopicSlug}
            />
          ))}

          {/* Infinite Scroll Trigger Sentinel */}
          <div ref={loadMoreRef} className="py-6 text-center">
            {isFetchingNextPage ? (
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#6E6D68]">
                <Loader2 className="w-4 h-4 animate-spin text-[#111111]" />
                <span>Đang tải thêm thảo luận...</span>
              </div>
            ) : hasNextPage ? (
              <span className="text-xs font-mono text-[#9A9890]">
                Cuộn xuống để tải thêm bài viết...
              </span>
            ) : (
              <div className="py-6 border-t border-[#D6D4CC] text-xs font-mono text-[#9A9890] flex items-center justify-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#111111]" />
                <span>Bạn đã xem hết các bài thảo luận trong mục này.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function CommunityPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="min-h-screen bg-[#F6F5F0] text-[#111111] flex flex-col justify-between">
      <div>
        {/* Editorial Top Navigation */}
        <header className="border-b border-[#111111] px-4 sm:px-8 lg:px-12 py-4 flex items-center justify-between text-xs">
          <Link
            href="/"
            className="font-semibold tracking-[0.14em] uppercase hover:opacity-60"
          >
            Deutschland.Nicht.Weit
          </Link>

          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/studienkollegs"
              className="text-[#6E6D68] hover:text-[#111111] uppercase tracking-wider hidden sm:inline"
            >
              Danh mục trường
            </Link>
            <Link
              href="/community"
              className="text-[#111111] font-medium uppercase tracking-wider underline underline-offset-4"
            >
              Cộng đồng
            </Link>
            {isAuthenticated ? (
              <Link
                href="/account"
                className="text-[#111111] hover:opacity-70 font-mono uppercase tracking-wider"
              >
                Hồ sơ →
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="text-[#111111] hover:opacity-70 font-mono uppercase tracking-wider"
              >
                Đăng nhập →
              </Link>
            )}
          </div>
        </header>

        <Suspense
          fallback={
            <div className="py-20 text-center text-xs font-mono text-[#6E6D68] flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#111111]" />
              <span>Đang mở diễn đàn...</span>
            </div>
          }
        >
          <CommunityContent />
        </Suspense>
      </div>

      <SiteFooter />
    </div>
  );
}
