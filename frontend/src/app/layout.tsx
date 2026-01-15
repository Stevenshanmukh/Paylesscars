import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import { MobileNavWrapper } from "@/components/layout/MobileNavWrapper";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Payless Cars - Buy Cars with Confidence",
  description: "Modern car marketplace with built-in price negotiation. Find your perfect vehicle and negotiate the best price directly with dealers.",
  keywords: ["car", "marketplace", "negotiation", "buy car", "new cars", "dealer"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`} suppressHydrationWarning>
        <QueryProvider>
          {/* Main content with bottom padding for mobile nav */}
          <div className="pb-16 md:pb-0">
            {children}
          </div>
          {/* Mobile bottom navigation */}
          <MobileNavWrapper />
          <Toaster position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}

