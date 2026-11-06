import type { Metadata } from "next";
import { Be_Vietnam_Pro, STIX_Two_Text } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"


const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
});

const stixTwoText = STIX_Two_Text({
  variable: "--font-stix",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Deutschland.Nicht.Weit — Tra cứu Studienkolleg tại Đức",
  description:
    "Tra cứu lịch thi Aufnahmetest, hạn nộp hồ sơ và đề mẫu các trường Studienkolleg tại Đức.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${stixTwoText.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-[#F6F5F0] text-[#111111] font-sans selection:bg-[#111111] selection:text-[#F6F5F0]">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
