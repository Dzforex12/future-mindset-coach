import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Future Mindset Coach",
  description: "Your personal AI-powered mindset dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#070b17] text-slate-100 antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 bg-[#070b17]">
            <Header />
            <div className="p-4 sm:p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
