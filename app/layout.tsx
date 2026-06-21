import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Toaster from "@/components/ui/Toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://labelforge.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LabelForge — Professional Web Label Designer",
    template: "%s | LabelForge",
  },
  description:
    "Design, merge, and print professional labels from your browser. Import CSV or Excel data, add barcodes, and print on Avery sheets — no install required.",
  keywords: [
    "label designer",
    "label maker",
    "online label printing",
    "barcode label",
    "Avery label",
    "CSV merge print",
    "thermal label",
    "ZPL label",
    "product label design",
  ],
  authors: [{ name: "LabelForge" }],
  creator: "LabelForge",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "LabelForge",
    title: "LabelForge — Professional Web Label Designer",
    description:
      "Design, merge, and print professional labels from your browser. No install required.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LabelForge — Web Label Designer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LabelForge — Professional Web Label Designer",
    description: "Design, merge, and print labels from any browser.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
