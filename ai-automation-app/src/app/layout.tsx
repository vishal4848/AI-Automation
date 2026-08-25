import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "AI Automation — All-in-One AI Content & Growth SaaS",
  description: "Generate images, videos, captions, hashtags, schedule social posts, and analyze performance with AI Automation.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plusJakartaSans.variable} ${playfairDisplay.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased selection:bg-blue-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
