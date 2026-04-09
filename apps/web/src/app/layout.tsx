import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "BetTok — Watch. Predict. Win.",
  description:
    "A mobile-first short-video prediction betting platform. Watch clips, predict what happens next, and win.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BetTok",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
  // Hint supported mobile browsers to prefer portrait.
  // We still enforce portrait via CSS blocker below.
  viewportFit: "cover",
  themeColor: "#0d0d0d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body className={inter.className}>
        <div id="app-root">
          <Providers>{children}</Providers>
        </div>
        <div id="orientation-lock" role="alert" aria-live="polite">
          <div className="orientation-lock__card">
            <p className="orientation-lock__title">Rotate to portrait</p>
            <p className="orientation-lock__text">
              This app is locked to vertical view.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
