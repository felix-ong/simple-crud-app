import type { Metadata, Viewport } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

// Chunky 8-bit display face for the wordmark, level number, and buttons.
const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
  display: "swap",
});

// A readable terminal/pixel face for body copy, quest titles, and numbers.
const vt323 = VT323({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quest Log — turn your to-dos into quests",
  description:
    "A gamified to-do list. Complete quests, earn XP, level up, and keep your streak alive.",
};

export const viewport: Viewport = {
  themeColor: "#14122b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${pressStart.variable} ${vt323.variable}`}>
      <body>{children}</body>
    </html>
  );
}
