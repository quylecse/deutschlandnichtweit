---
name: frontend-guidelines
description: >-
  Cẩm nang kiến trúc và quy chuẩn phát triển Frontend cho dự án DeutschlandNichtWeit
  (Next.js App Router, Tailwind CSS v4, phong cách thiết kế Swiss/Bauhaus Editorial,
  quy tắc định dạng dữ liệu tuyển sinh và xử lý lỗi chuẩn Rule 14).
---

# Frontend Guidelines & Architecture - DeutschlandNichtWeit

Tài liệu này tổng hợp toàn bộ kiến trúc, nguyên tắc thiết kế, quy chuẩn xử lý dữ liệu và kinh nghiệm thực chiến đã được triển khai trên Frontend của hệ thống DeutschlandNichtWeit. Bất kỳ AI Agent hoặc lập trình viên nào khi làm việc với Frontend đều phải tuân thủ các nguyên tắc này.

---

## 1. Công nghệ Cốt lõi & Cấu trúc Thư mục

- **Framework**: Next.js 16 (App Router, Turbopack, Partial Prerendering / React Server Components).
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss";` trong `globals.css`).
- **Icons**: `lucide-react`.
- **Cấu trúc thư mục (`frontend/src/app`)**:
  - `components/`: Chứa các UI components dùng chung (Bảng tra cứu `StudienkollegTable.tsx`, Lịch thi `SemesterDateDisplay.tsx`, Footer `SiteFooter.tsx`, Hiển thị văn bản cấu trúc `StructuredText.tsx`, v.v.).
  - `lib/`: Chứa API fetchers và các hàm xử lý dữ liệu thuần túy (`studienkollegs.ts`, `schoolImages.ts`).
  - `types/`: Định nghĩa TypeScript interfaces (`studienkolleg.ts`, v.v.).
  - `studienkollegs/`: Trang danh sách và trang chi tiết theo trường (`[slug]/page.tsx`).
  - `auth/`: Các trang liên quan đến xác thực (Kích hoạt email `auth/verify/page.tsx`, Đăng nhập, Đăng ký).

---

## 2. Design System & Triết lý Giao diện (Swiss / Bauhaus Editorial)

Giao diện DeutschlandNichtWeit được lấy cảm hứng từ phong cách báo chí biên tập Đức (German Editorial) và trường phái Thiết kế Thụy Sĩ (Swiss Style):

- **Bảng màu chủ đạo**:
  - Nền chính: `#F6F5F0` (Off-white / Giấy báo ngà).
  - Nền phụ / Card / Header bảng: `#EFECE6`.
  - Màu chữ chính & Viền cứng: `#111111` (Ink black).
  - Màu chữ phụ / Chú thích: `#6E6D68`, `#5A5955`.
- **Typography**:
  - Tiêu đề, số thứ tự lớn: `font-editorial` (Font STIX Two Text / Serif).
  - Nội dung, nhãn, dữ liệu: `font-sans` (Be Vietnam Pro).
  - Mã trường, kỳ học, ngày tháng, badge: `font-mono`.
- **Đường nét & Khối**:
  - Sử dụng viền sắc nét `border border-[#111111]`, hạn chế bo tròn lớn (ưu tiên góc vuông hoặc chỉ bo nhẹ).
  - Các badge trạng thái sử dụng tương phản mạnh: nền đen chữ trắng (`bg-[#111111] text-[#F6F5F0]`) hoặc viền mảnh tối giản.

---

## 3. Quy chuẩn Xử lý & Hiển thị Dữ liệu Tuyển sinh

### 3.1. Phân biệt Lệ phí dự thi (`exam_fee`) và Phí học kỳ (`Semesterbeitrag`)
- **Nguyên tắc**: Cột "Lệ phí dự thi" **CHỈ** được hiển thị mức phí dự thi Aufnahmetest nếu trường có thu tiền thi.
- Hầu hết các trường công lập của Đức (như TU Berlin, Leipzig, Zittau/Görlitz...) **miễn phí thi**. Khi dữ liệu có nhắc đến `Semesterbeitrag` (~200–350 EUR), hàm `formatExamFeeShort()` phải lọc bỏ và hiển thị là **`"Miễn phí"`**.

### 3.2. Định dạng Lịch thi & Hạn nộp (`SemesterDateDisplay` & `extractSortableTimestamp`)
- Tách bạch rõ 2 kỳ học của Đức:
  - **`WiSe`**: Wintersemester (Kỳ Đông).
  - **`SoSe`**: Sommersemester (Kỳ Hè).
- Khi sắp xếp (Sort) cột Lịch thi hoặc Hạn nộp:
  - **Không dùng `localeCompare`** trên chuỗi `DD.MM.YYYY` vì sẽ làm sai thứ tự tháng.
  - Phải dùng hàm `extractSortableTimestamp()` để chuyển sang timestamp ms trước khi so sánh.
  - Các trường đã có ngày cụ thể luôn xếp trên các trường "Chưa công bố".

### 3.3. Hình thức thi (`formatExamModeShort`)
- Hiển thị gọn gàng trên 1 dòng duy nhất, không dùng viền đóng khung hay text phụ nhiều dòng:
  - `"Tại chỗ"` (Präsenz)
  - `"Online"` (Trực tuyến)
  - `"Online & Tại chỗ"`

### 3.4. Cổng nộp hồ sơ (`formatPortalShort`)
- Hiển thị dạng chữ phẳng, không đóng khung viền để giữ độ thoáng và đồng bộ với các cột khác.
- Không hiển thị số lượng mục hồ sơ trên danh sách bảng chung (thông tin này hiển thị ở Drawer chi tiết).

---

## 4. Xử lý Lỗi & Tích hợp Xác thực (Rule 14 & Rule 15)

- **Rule 14 (Zero Error Message from Backend)**:
  - Backend NestJS chỉ trả về mã lỗi (`INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`, `LINK_NOT_FOUND_OR_EXPIRED`...).
  - Frontend phải có một từ điển Mapping (như trong `auth/verify/page.tsx`) để chuyển đổi mã lỗi sang thông báo tiếng Việt thân thiện với người dùng.
- **Rule 15 (OWASP & Cookie Security)**:
  - Mọi request gửi lên Backend đều phải bật `credentials: 'include'` để đính kèm cookie `HttpOnly`.
  - Không bao giờ lưu Access Token hoặc Refresh Token trong `localStorage` hay `sessionStorage`.

