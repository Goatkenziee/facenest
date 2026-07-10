import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "FaceNest — Face Recognition",
  description:
    "FaceNest uses on-device AI to detect, match, and organize faces right from your phone. No uploads, no servers — your privacy stays yours.",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "FaceNest" },
};

export const viewport: Viewport = {
  themeColor: "#f0e6ea",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="touch-manipulation">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased safe-bottom">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
