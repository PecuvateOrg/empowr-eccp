import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { INSTALL_CAPTURE } from "@/lib/install-capture";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Empowr ECCP",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/eccp-app-icon.svg" },
  appleWebApp: { capable: true, title: "Empowr ECCP", statusBarStyle: "default" },
  description: "Empowr's pathway from member to certified coach.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={nunito.variable}>
      <head>
        {/* Install prompt + service worker on every visit (lib/install-capture.ts). */}
        <script dangerouslySetInnerHTML={{ __html: INSTALL_CAPTURE }} />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
