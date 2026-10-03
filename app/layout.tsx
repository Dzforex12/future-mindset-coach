import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MobileNav, Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Future Mindset Coach",
  description: "Trade with discipline. Build your future.",
  applicationName: "Future Mindset Coach",
  appleWebApp: {
    capable: true,
    title: "Future Mindset Coach",
    statusBarStyle: "black-translucent",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050b14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#050b14] text-slate-100 antialiased">
        <div className="mx-auto flex min-h-screen max-w-[1600px] bg-[#050b14] shadow-[0_0_0_1px_rgba(148,163,184,0.08)]">
          <Sidebar />
          <main className="relative min-w-0 flex-1 overflow-hidden bg-[#050b14]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(59,130,246,0.18),_transparent_35%)]" />
            <div className="relative">
              <Header />
              <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-3 sm:px-5 lg:px-6">{children}</div>
            </div>
          </main>
        </div>
        <MobileNav />
      </body>
    </html>
  );
}
