'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Lock, Mail } from 'lucide-react';
import { useSignUp, getAuthErrorMessage } from '../../hooks/useAuth';

export default function RegisterPage() {
  const signUpMutation = useSignUp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Vui lòng điền đầy đủ email và mật khẩu.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Mật khẩu cần tối thiểu 8 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      await signUpMutation.mutateAsync({ email: email.trim(), password });
      setIsSuccess(true);
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

      {/* Main Register Form Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-md border border-[#111111] bg-[#F6F5F0] p-6 sm:p-8">
          {/* Header Typography */}
          <div className="mb-8 border-b border-[#111111] pb-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#6E6D68] block mb-1">
              02 / Thành viên mới
            </span>
            <h1 className="font-editorial text-2xl sm:text-3xl text-[#111111]">
              Đăng ký tài khoản
            </h1>
          </div>

          {isSuccess ? (
            <div className="space-y-6">
              <div className="p-4 border border-[#111111] bg-[#EFF6EE] text-[#1B6327] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="font-semibold mb-1">Đăng ký thành công!</p>
                  <p>
                    Hệ thống đã gửi một đường dẫn kích hoạt đến địa chỉ{' '}
                    <strong className="text-[#111111] font-mono">{email}</strong>. Vui lòng mở hộp thư và nhấn vào liên kết xác thực (có hiệu lực trong 15 phút) để kích hoạt tài khoản.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <Link
                  href="/auth/login"
                  className="w-full py-3 bg-[#111111] text-[#F6F5F0] text-xs uppercase tracking-[0.16em] font-medium text-center hover:opacity-85 transition-opacity"
                >
                  Tới trang Đăng nhập →
                </Link>
                <Link
                  href="/"
                  className="w-full py-3 border border-[#111111] text-[#111111] text-xs uppercase tracking-[0.16em] font-medium text-center hover:bg-[#EAE7DF] transition-colors"
                >
                  Quay lại Trang chủ
                </Link>
              </div>
            </div>
          ) : (
            <>
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
                    htmlFor="reg-email"
                    className="text-[10px] uppercase tracking-[0.14em] text-[#6E6D68] mb-1.5 block"
                  >
                    Địa chỉ Email
                  </label>
                  <div className="relative flex items-center border border-[#111111] bg-[#F6F5F0] focus-within:ring-1 focus-within:ring-[#111111]">
                    <Mail className="w-4 h-4 text-[#6E6D68] ml-3 shrink-0" />
                    <input
                      id="reg-email"
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
                  <label
                    htmlFor="reg-password"
                    className="text-[10px] uppercase tracking-[0.14em] text-[#6E6D68] mb-1.5 block"
                  >
                    Mật khẩu (Tối thiểu 8 ký tự)
                  </label>
                  <div className="relative flex items-center border border-[#111111] bg-[#F6F5F0] focus-within:ring-1 focus-within:ring-[#111111]">
                    <Lock className="w-4 h-4 text-[#6E6D68] ml-3 shrink-0" />
                    <input
                      id="reg-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent px-3 py-2.5 text-xs sm:text-sm text-[#111111] focus:outline-none placeholder:text-[#9A9890]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reg-confirm"
                    className="text-[10px] uppercase tracking-[0.14em] text-[#6E6D68] mb-1.5 block"
                  >
                    Xác nhận Mật khẩu
                  </label>
                  <div className="relative flex items-center border border-[#111111] bg-[#F6F5F0] focus-within:ring-1 focus-within:ring-[#111111]">
                    <Lock className="w-4 h-4 text-[#6E6D68] ml-3 shrink-0" />
                    <input
                      id="reg-confirm"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent px-3 py-2.5 text-xs sm:text-sm text-[#111111] focus:outline-none placeholder:text-[#9A9890]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={signUpMutation.isPending}
                  className="w-full mt-2 py-3 bg-[#111111] text-[#F6F5F0] text-xs uppercase tracking-[0.16em] font-medium hover:opacity-85 transition-opacity cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {signUpMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tạo tài khoản...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng ký thành viên</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Switch to Login */}
              <div className="mt-8 pt-4 border-t border-[#D6D4CC] flex items-center justify-between text-xs text-[#6E6D68]">
                <span>Đã có tài khoản?</span>
                <Link
                  href="/auth/login"
                  className="text-[#111111] underline underline-offset-4 font-medium hover:opacity-60"
                >
                  Đăng nhập →
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-[#111111] py-4 text-center text-[10px] uppercase tracking-[0.16em] text-[#6E6D68]">
        © 2026 DEUTSCHLAND.NICHT.WEIT — BẢO MẬT & CHUẨN HÓA TUYỂN SINH
      </footer>
    </div>
  );
}

