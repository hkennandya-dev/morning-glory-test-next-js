import type { Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"
import 'simplebar-react/dist/simplebar.min.css';
import "yet-another-react-lightbox/styles.css";
import ScrollLayout from "@/components/scroll-layout";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="overflow-x-hidden">
        <ScrollLayout>
          {children}
        </ScrollLayout>
        <Toaster />
      </body>
    </html>
  );
}
