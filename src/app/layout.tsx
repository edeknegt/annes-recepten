import type { Metadata, Viewport } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";
import { RegisterServiceWorker } from "@/components/register-service-worker";

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Anne's keuken",
  description: "Recepten en boodschappenlijst van Anne",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Anne's keuken",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#FFFBE6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={`${raleway.variable} h-full antialiased`}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
