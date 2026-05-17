import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SpecsAI | The Living Blueprint for SDLC",
  description: "AI-Powered, Zero-Touch Quality Engineering Platform. Turn Jira user stories into Playwright tests instantly. Autonomous self-healing CI/CD with Google Gemini.",
  openGraph: {
    title: "SpecsAI | Autonomous SDLC Engine",
    description: "Turn Jira stories into Playwright tests. Automatically. Powered by Google Gemini 2.5 Flash.",
    url: "https://specsai.co",
    siteName: "SpecsAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpecsAI | Autonomous SDLC Engine",
    description: "Turn Jira stories into Playwright tests. Automatically.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
