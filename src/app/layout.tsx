import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/layout/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "F5 Pulse",
  description: "Who should I contact today, why, and what should happen next?",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <BottomNav />
        <div className="mx-auto flex min-h-full w-full max-w-[980px] flex-col px-4 pb-10 pt-24 sm:px-6 md:px-8 md:pt-28 lg:px-12">
          {children}
        </div>
      </body>
    </html>
  );
}
