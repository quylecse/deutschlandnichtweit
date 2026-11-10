'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, Loader2, Lock, Mail } from 'lucide-react';
import { useSignIn, getAuthErrorMessage } from '../../hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const signInMutation = useSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    try {
      await signInMutation.mutateAsync({ email: email.trim(), password });
      router.push('/account');
      router.refresh();
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setErrorMessage(getAuthErrorMessage(errObj?.message));
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F5F0] text-[#111111] flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-[#111111] px-4 sm:px-8 lg:px-12 py-4 flex items-center justify-between text-xs">
        <Link
          href="/"
          className="font-semibold tracking-[0.14em] uppercase hover:opacity-60"
        >
          Deutschland.Nicht.Weit
        </Link>
        <Link
          href="/"
          className="text-[#6E6D68] hover:text-[#111111] uppercase tracking-wider"
        >
          ← Trang chủ
        </Link>
      </header>

      {/* Main Login Form Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-md border border-[#111111] bg-[#F6F5F0] p-6 sm:p-8">
          {/* Header Typography (Editorial Swiss Style) */}
          <div className="mb-8 border-b border-[#111111] pb-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#6E6D68] block mb-1">
              01 / Xác thực
            </span>
            <h1 className="font-editorial text-2xl sm:text-3xl text-[#111111]">
              Đăng nhập tài khoản
            </h1>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-3 border border-[#111111] bg-[#FAF2EF] text-[#A32A15] text-xs flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="text-[10px] uppercase tracking-[0.14em] text-[#6E6D68] mb-1.5 block"
              >
                Địa chỉ Email
              </label>
              <div className="relative flex items-center border border-[#111111] bg-[#F6F5F0] focus-within:ring-1 focus-within:ring-[#111111]">
                <Mail className="w-4 h-4 text-[#6E6D68] ml-3 shrink-0" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vidu@deutschland.de"
                  className="w-full bg-transparent px-3 py-2.5 text-xs sm:text-sm text-[#111111] focus:outline-none placeholder:text-[#9A9890]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="text-[10px] uppercase tracking-[0.14em] text-[#6E6D68] block"
                >
                  Mật khẩu
                </label>
              </div>
              <div className="relative flex items-center border border-[#111111] bg-[#F6F5F0] focus-within:ring-1 focus-within:ring-[#111111]">
                <Lock className="w-4 h-4 text-[#6E6D68] ml-3 shrink-0" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent px-3 py-2.5 text-xs sm:text-sm text-[#111111] focus:outline-none placeholder:text-[#9A9890]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={signInMutation.isPending}
              className="w-full mt-2 py-3 bg-[#111111] text-[#F6F5F0] text-xs uppercase tracking-[0.16em] font-medium hover:opacity-85 transition-opacity cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {signInMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="mt-8 pt-4 border-t border-[#D6D4CC] flex items-center justify-between text-xs text-[#6E6D68]">
            <span>Chưa có tài khoản?</span>
            <Link
              href="/auth/register"
              className="text-[#111111] underline underline-offset-4 font-medium hover:opacity-60"
            >
              Đăng ký ngay →
            </Link>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-[#111111] py-4 text-center text-[10px] uppercase tracking-[0.16em] text-[#6E6D68]">
        © 2026 DEUTSCHLAND.NICHT.WEIT — BẢO MẬT & CHUẨN HÓA TUYỂN SINH
      </footer>
    </div>
  );
}

