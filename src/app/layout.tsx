import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Thai } from "next/font/google";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TheRoom Resort ชุมแพ — ระบบบริหารจัดการโรงแรม & ที่พักรายเดือน",
  description: "ระบบจัดการโรงแรม ที่พักรายเดือน จดมิเตอร์น้ำ-ไฟ ห้องอาหาร POS มินิบาร์ และแม่บ้าน",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TheRoom Resort ชุมแพ",
  },
};

export const viewport: Viewport = {
  themeColor: "#2D160B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} ${notoThai.variable} h-full bg-[#2D160B] antialiased`}
    >
      <body className="min-h-full bg-[#2D160B] text-slate-900 font-sans">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
