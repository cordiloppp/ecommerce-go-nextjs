import type { Metadata } from "next";

import DemoBanner from "@/components/DemoBanner";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "ElectroShop — Tienda de electrónica",
  description: "E-commerce de productos electrónicos con carrito y descuentos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        <DemoBanner />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
