'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const ERROR_MESSAGES: Record<string, string> = {
  LINK_NOT_FOUND_OR_EXPIRED:
    'Đường link xác thực không hợp lệ, đã hết hạn (15 phút) hoặc đã được sử dụng trước đó.',
  EMAIL_ALREADY_VERIFIED:
    'Tài khoản này đã được xác thực từ trước. Bạn có thể đăng nhập ngay.',
  USER_NOT_FOUND: 'Không tìm thấy thông tin tài khoản người dùng tương ứng.',
  USER_ID_REQUIRED: 'Yêu cầu không hợp lệ. Thiếu thông tin người dùng.',
};

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleVerify = async () => {
    if (!token) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verifyToken: token }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Backend trả mã lỗi chuẩn hóa qua data.message (Rule 14)
        const code = Array.isArray(data.message) ? data.message[0] : data.message;
        const friendlyMessage =
          ERROR_MESSAGES[code] ||
          'Không thể kích hoạt tài khoản. Vui lòng thử lại sau.';
        setErrorMessage(friendlyMessage);
        setStatus('error');
        return;
      }

      setStatus('success');
    } catch (err) {
      console.error('Lỗi khi gọi API kích hoạt:', err);
      setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng hoặc thử lại sau.');
      setStatus('error');
    }
  };

  // Trường hợp không có token trên URL
  if (!token) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 text-center max-w-md w-full">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">
          Thiếu mã xác thực
        </h2>
        <p className="text-neutral-600 text-sm mb-6">
          Không tìm thấy mã xác thực trên đường dẫn. Vui lòng kiểm tra lại email bạn vừa nhận được hoặc yêu cầu gửi lại link mới.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-neutral-900 text-white font-medium text-sm hover:bg-neutral-800 transition"
        >
          Quay lại Trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 max-w-md w-full text-center">
      {status === 'idle' && (
        <>
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Xác thực tài khoản
          </h2>
          <p className="text-neutral-600 text-sm mb-6 leading-relaxed">
            Cảm ơn bạn đã đăng ký! Nhấn vào nút bên dưới để hoàn tất việc xác nhận email và chính thức kích hoạt tài khoản của bạn.
          </p>
          <button
            onClick={handleVerify}
            className="w-full py-3 px-4 rounded-xl bg-neutral-900 text-white font-medium text-sm hover:bg-neutral-800 transition shadow-sm cursor-pointer"
          >
            Kích hoạt tài khoản ngay
          </button>
        </>
      )}

      {status === 'loading' && (
        <div className="py-8">
          <Loader2 className="w-10 h-10 text-neutral-900 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-1">
            Đang kích hoạt tài khoản...
          </h3>
          <p className="text-neutral-500 text-sm">
            Vui lòng đợi trong giây lát, hệ thống đang xử lý mã của bạn.
          </p>
        </div>
      )}

      {status === 'success' && (
        <>
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Kích hoạt thành công!
          </h2>
          <p className="text-neutral-600 text-sm mb-6 leading-relaxed">
            Địa chỉ email của bạn đã được xác thực an toàn. Bây giờ bạn có thể đăng nhập vào hệ thống để tiếp tục trải nghiệm.
          </p>
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition shadow-sm"
          >
            Đến trang Đăng nhập
            <ArrowRight className="w-4 h-4" />
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Xác thực không thành công
          </h2>
          <p className="text-rose-600 text-sm mb-6 leading-relaxed bg-rose-50 p-3 rounded-lg border border-rose-100">
            {errorMessage}
          </p>
          <div className="space-y-2">
            <button
              onClick={handleVerify}
              className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 text-white font-medium text-sm hover:bg-neutral-800 transition cursor-pointer"
            >
              Thử lại
            </button>
            <Link
              href="/"
              className="w-full inline-block py-2.5 px-4 rounded-xl text-neutral-600 font-medium text-sm hover:text-neutral-900 transition"
            >
              Quay lại Trang chủ
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-neutral-50/50">
      <Suspense
        fallback={
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 text-center max-w-md w-full">
            <Loader2 className="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-2" />
            <p className="text-neutral-500 text-sm">Đang tải...</p>
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}

