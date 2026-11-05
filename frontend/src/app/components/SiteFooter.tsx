import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#111111] bg-[#EFECE6] text-[#111111]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center justify-between">
          {/* Brand & Short Note */}
          <div className="md:col-span-5 space-y-2">
            <Link href="/" className="font-editorial text-2xl sm:text-3xl tracking-tight block">
              Deutschland.Nicht.Weit
            </Link>
            <p className="text-xs text-[#5A5955] max-w-sm leading-relaxed">
              Dữ liệu được tổng hợp tự động từ trang chủ các trường Studienkolleg tại Đức. Vui lòng
              kiểm tra thêm trên website trường trước khi nộp hồ sơ.
            </p>
            <p className="pt-2 text-[11px] text-[#6E6D68]">© 2026 Deutschland.Nicht.Weit</p>
          </div>

          {/* Developer Support QR Section */}
          <div className="md:col-span-7 flex flex-col sm:flex-row sm:items-center md:justify-end gap-5">
            <div className="max-w-xs space-y-1.5 sm:text-right">
              <p className="font-editorial text-xl text-[#111111]">Mình thích uống cà phê.</p>
              <p className="text-xs text-[#5A5955] leading-relaxed">
                Nếu bạn cảm thấy hài lòng, hãy ủng hộ mình một ly cà phê để mình thức khuya làm web cho bạn dùng nhé.
              </p>
            </div>

            {/* Minimalist QR Box */}
            <div className="shrink-0 border border-[#111111] bg-[#F6F5F0] p-2 w-28 h-28 flex items-center justify-center">
              <img
                src="/qr-coffee.png"
                alt="Mã QR ủng hộ nhà phát triển"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
