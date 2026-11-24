import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Tanquea Mejor | Inteligencia de combustible",
  description: "Compara registros históricos de combustible en Colombia.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
