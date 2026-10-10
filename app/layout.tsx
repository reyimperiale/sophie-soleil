import type { Metadata, Viewport } from "next";
import { appConfig } from "@/config/avatar";
import "./theme.css";
import "./globals.css";

export const metadata: Metadata = {
  title: appConfig.name,
  description: "AI companion conversacional",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: appConfig.name,
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a0d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
