import type { Metadata, Viewport } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Recepten van Anne",
  description: "Anne's persoonlijke receptenverzameling",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Recepten van Anne",
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
    <html lang="nl" className={`${raleway.variable} h-full antialiased`} style={{ backgroundColor: '#FFFBE6' }}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {/* Splash screen — visible until page hydrates */}
        <div
          id="splash"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFBE6',
          }}
        >
          <img
            id="splash-logo"
            src="/erik-anne-drinks.png"
            alt=""
            width={96}
            height={96}
            style={{ borderRadius: '20px', transition: 'all 0.5s ease' }}
          />
          <p id="splash-text" style={{ marginTop: '16px', fontSize: '14px', color: '#BF9A14', fontWeight: 500, transition: 'opacity 0.3s' }}>Laden...</p>
        </div>
        {children}
      </body>
    </html>
  );
}
