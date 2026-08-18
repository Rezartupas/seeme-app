import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "See Me Reminder",
  description: "Aplikasi To-Do List berbasis Kalender dengan Matriks Eisenhower",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`h-full ${spaceGrotesk.variable}`}>
      <body className="min-h-full bg-background text-on-background font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
