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
        <div className="flex min-h-screen flex-col">
          <div className="flex flex-1">
            <Sidebar />
            <main className="min-w-0 flex-1 bg-[#050b14] pb-20 lg:pb-0">
              <Header />
              <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
            </main>
          </div>
          <MobileNav />
        </div>
      </body>
    </html>
  );
}
