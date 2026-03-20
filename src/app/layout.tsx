import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Cuchara – Menús del día en Azca",
  description: "Descubre y publica los mejores menús del día en el corazón de Azca, Madrid.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
