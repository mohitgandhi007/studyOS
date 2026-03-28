import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/ui/Sidebar";
import { AnimatedBackground } from "@/components/fluid/AnimatedBackground";
import { DataProvider } from "@/store/DataContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Study OS",
  description: "AI-powered Study OS web app with a futuristic UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased text-white`}>
        <DataProvider>
          <AnimatedBackground />
          <Sidebar />
          <main className="pl-20 min-h-screen relative w-full overflow-hidden scene-3d">
            {children}
          </main>
        </DataProvider>
      </body>
    </html>
  );
}
