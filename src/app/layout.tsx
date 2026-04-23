import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import Navbar from "@/components/layout/Navbar";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import CartDrawer from "@/components/cart/CartDrawer";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "Go-Shopping | Tu tienda premium en línea",
  description: "Compra productos exclusivos con pago fácil vía SINPE Móvil y PayPal. La mejor experiencia de e-commerce en Costa Rica.",
  keywords: "e-commerce, compras, online, Costa Rica, SINPE Móvil, PayPal, premium",
  authors: [{ name: "Antigravity AI" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="fade-in">
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <Navbar />
              <CartDrawer />
              <main style={{ paddingTop: 'var(--header-height)' }}>
                {children}
              </main>
              <ConditionalFooter />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
