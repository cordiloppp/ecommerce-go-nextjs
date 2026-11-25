import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import DemoBanner from "@/components/DemoBanner";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "ElectroShop · Electrónica para tu escritorio",
  description:
    "Audífonos, teclados, monitores y almacenamiento, con carrito y cupones de descuento.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-MX" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">
        <Navbar />
        <DemoBanner />
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
        <footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 border-t px-4 py-8 text-[13px] text-gray-500 sm:px-6">
          <span>ElectroShop · proyecto de práctica, el pago es simulado</span>
          <a
            href="https://github.com/cordiloppp/ecommerce-go-nextjs"
            className="transition-colors hover:text-gray-900"
          >
            Código en GitHub
          </a>
        </footer>
      </body>
    </html>
  );
}
