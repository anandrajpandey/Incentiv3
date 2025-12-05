import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DeBounty",
  description: "Decentralized Bounty Platform",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body
        className={`relative min-h-screen font-sans antialiased bg-[#030014] text-white ${geist.className}`}
      >
        {/* ✨ Space animated background */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          {/* Stars field */}
          <div className="absolute inset-0 bg-[url('/stars.png')] opacity-60 animate-stars" />
          {/* Purple nebula glow */}
          <div className="absolute top-0 left-0 w-[70vw] h-[70vw] bg-purple-700/20 blur-[180px] rounded-full -translate-y-1/3 -translate-x-1/3" />
          {/* Cyan nebula glow */}
          <div className="absolute bottom-0 right-0 w-[70vw] h-[70vw] bg-cyan-500/20 blur-[200px] rounded-full translate-y-1/4 translate-x-1/4" />
        </div>

        {/* App Content */}
        <main className="relative z-10">{children}</main>

        <Analytics />
      </body>
    </html>
  );
}
