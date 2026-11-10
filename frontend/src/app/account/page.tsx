'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  LogOut,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useCurrentUser, useSignOut } from '../hooks/useAuth';
import { useAuthStore } from '../stores/useAuthStore';
import SiteFooter from '../components/SiteFooter';

export default function AccountPage() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();
  const signOutMutation = useSignOut();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    // Nếu kiểm tra xong mà không có session, chuyển hướng về trang đăng nhập
    if (!isLoading && !isAuthenticated && !user) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleSignOut = async () => {
    try {
      await signOutMutation.mutateAsync();
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Lỗi khi đăng xuất:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F5F0] text-[#111111] flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-[#6E6D68]">
          <Loader2 className="w-4 h-4 animate-spin text-[#111111]" />
          <span>Đang kiểm tra phiên đăng nhập...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F6F5F0] text-[#111111] flex flex-col justify-between">
      <div>
        {/* Header */}
        <header className="border-b border-[#111111] px-4 sm:px-8 lg:px-12 py-4 flex items-center justify-between text-xs">
          <Link
            href="/"
            className="font-semibold tracking-[0.14em] uppercase hover:opacity-60"
          >
            Deutschland.Nicht.Weit
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/studienkollegs"
              className="text-[#6E6D68] hover:text-[#111111] uppercase tracking-wider hidden sm:inline"
            >
              Danh mục trường
            </Link>
            <Link
              href="/"
              className="text-[#6E6D68] hover:text-[#111111] uppercase tracking-wider"
            >
              ← Trang chủ
            </Link>
          </div>
        </header>

        {/* Account Dashboard Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-14">
          {/* Breadcrumb info */}
          <div className="flex items-center justify-between border-b border-[#111111] pb-4 mb-8 text-xs text-[#6E6D68]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#111111]" />
              <span className="uppercase tracking-[0.16em]">Hồ sơ cá nhân & Bảo mật</span>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signOutMutation.isPending}
              className="text-xs uppercase tracking-wider text-[#A32A15] hover:opacity-70 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{signOutMutation.isPending ? 'Đang thoát...' : 'Đăng xuất'}</span>
            </button>
          </div>

          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#6E6D68] block mb-2">
                User Dashboard
              </span>
              <h1 className="font-editorial text-3xl sm:text-4xl text-[#111111]">
                Tài khoản của bạn
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="border border-[#111111] px-2.5 py-1 text-xs uppercase font-mono font-medium">
                {user.roles?.includes('admin') ? 'Quản trị viên' : 'Thành viên'}
              </span>
            </div>
          </div>

          {/* User Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 border-t border-[#111111] pt-8">
            {/* Left: General Info */}
            <div className="md:col-span-7 space-y-6">
              <div>
                <h2 className="text-xs uppercase tracking-[0.14em] text-[#6E6D68] mb-3">
                  01 / Thông tin định danh
                </h2>
                <dl className="divide-y divide-[#D6D4CC] border-t border-b border-[#D6D4CC] text-xs sm:text-sm">
                  <div className="py-3 flex justify-between gap-4">
                    <dt className="text-[#6E6D68] flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Địa chỉ Email</span>
                    </dt>
                    <dd className="font-mono font-medium text-[#111111] truncate max-w-[240px]">
                      {user.email}
                    </dd>
                  </div>

                  <div className="py-3 flex justify-between gap-4">
                    <dt className="text-[#6E6D68] flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Trạng thái Email</span>
                    </dt>
                    <dd className="text-right">
                      {user.emailVerified ? (
                        <span className="text-[#1B6327] inline-flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã xác thực
                        </span>
                      ) : (
                        <span className="text-[#B25E00] inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Chờ kích hoạt
                        </span>
                      )}
                    </dd>
                  </div>

                  <div className="py-3 flex justify-between gap-4">
                    <dt className="text-[#6E6D68] flex items-center gap-2">
                      <User className="w-3.5 h-3.5" />
                      <span>Mã người dùng (ID)</span>
                    </dt>
                    <dd className="font-mono text-xs text-[#6E6D68] truncate max-w-[220px]">
                      {user.id}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Quick Navigation / Features */}
              <div>
                <h2 className="text-xs uppercase tracking-[0.14em] text-[#6E6D68] mb-3">
                  02 / Lối tắt tính năng
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    href="/studienkollegs"
                    className="p-4 border border-[#111111] hover:bg-[#111111] hover:text-[#F6F5F0] transition-colors group"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-[#6E6D68] group-hover:text-[#C8C5BC] mb-1">
                      Khám phá
                    </div>
                    <div className="font-editorial text-base flex items-center justify-between">
                      <span>Bảng tra cứu 22 trường</span>
                      <span className="text-sm font-sans">→</span>
                    </div>
                  </Link>

                  <Link
                    href="/#bangtracuu"
                    className="p-4 border border-[#111111] hover:bg-[#111111] hover:text-[#F6F5F0] transition-colors group"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-[#6E6D68] group-hover:text-[#C8C5BC] mb-1">
                      Định hướng
                    </div>
                    <div className="font-editorial text-base flex items-center justify-between">
                      <span>La bàn khối học T/M/W/G</span>
                      <span className="text-sm font-sans">→</span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: Security & Session Status */}
            <div className="md:col-span-5 space-y-6">
              <div className="p-5 border border-[#111111] bg-[#EFECE6]/70">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="w-4 h-4 text-[#111111]" />
                  <h3 className="text-xs uppercase tracking-[0.14em] font-semibold text-[#111111]">
                    Bảo mật chuẩn OWASP
                  </h3>
                </div>
                <p className="text-xs text-[#5A5955] leading-relaxed mb-4">
                  Phiên đăng nhập của bạn được bảo vệ bằng cơ chế Cookie{' '}
                  <code className="text-[#111111] font-mono bg-[#E2DFD6] px-1 py-0.5">
                    HttpOnly
                  </code>{' '}
                  và mã hóa JWT xoay vòng tự động. Trình duyệt không lưu mật khẩu ở dạng thô hay bộ nhớ không an toàn.
                </p>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signOutMutation.isPending}
                  className="w-full py-2.5 border border-[#111111] bg-[#F6F5F0] text-[#111111] text-xs uppercase tracking-wider font-medium hover:bg-[#111111] hover:text-[#F6F5F0] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {signOutMutation.isPending ? 'Đang thoát...' : 'Đăng xuất khỏi thiết bị'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}

