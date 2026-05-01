import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SnowCX — Agentic CX Intelligence",
  description: "Multi-agent customer experience intelligence powered by Snowflake",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${inter.className} antialiased bg-bg-deep text-text-primary min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
