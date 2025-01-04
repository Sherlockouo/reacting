import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LiveAPIProvider } from "@/contexts/LiveAPIContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MBTI Music Recommendation",
  description:
    "MBTI Music Recommendation is a music recommendation system based on the Myers-Briggs Type Indicator (MBTI) personality test.",
};

const API_KEY = process.env.GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const host = "ws-gemini.larc.top";
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LiveAPIProvider url={uri} apiKey={API_KEY}>
          {children}
        </LiveAPIProvider>
      </body>
    </html>
  );
}
