import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PasswordResetBanner from "@/components/layout/PasswordResetBanner";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "VAYO — Book Buses Across East Africa",
  description: "Book intercity bus tickets online across Rwanda, Uganda, Kenya, and Tanzania. Fast, simple, and reliable.",
  keywords: "bus tickets, Rwanda, East Africa, intercity bus, kigali, kampala",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col bg-slate-50">
        <Header />
        <PasswordResetBanner />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
