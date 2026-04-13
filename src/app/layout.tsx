import type { Metadata } from "next";
import { getAllCategories } from "@/lib/queries-db";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ChatWidgetShell from "@/components/chat/ChatWidgetShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "TechStore | Linh kiện PC, laptop và màn hình chính hãng",
  description:
    "Cửa hàng linh kiện máy tính, laptop và màn hình cho nhu cầu gaming, làm việc và build PC. Giá tốt, bảo hành rõ ràng, giao nhanh toàn quốc.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getAllCategories();

  return (
    <html lang="vi">
      <body className="flex min-h-screen flex-col">
        <a href="#main-content" className="skip-link">
          Bỏ qua để tới nội dung chính
        </a>
        <CartProvider>
          <Header categories={categories} />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <ChatWidgetShell />
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
