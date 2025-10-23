import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientProvider from "./ClientProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MTG Timer & Control System",
  description: "Timer para Magic: The Gathering con panel de control remoto",
  manifest: "/manifest.webmanifest",
  themeColor: "#111827",
  icons: {
    icon: "/logoboards.png",
    shortcut: "/logoboards.png",
    apple: "/logoboards.png",
  },
  applicationName: "MTG Timer",
};

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
        <ClientProvider>
          {children}
        </ClientProvider>
      </body>
    </html>
  );
}
