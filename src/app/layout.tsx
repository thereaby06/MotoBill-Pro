import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { WorkshopProvider } from "@/lib/data/workshop-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "MotoBill Pro",
    template: "%s · MotoBill Pro",
  },
  description:
    "Sistema de gestión y facturación para talleres de motocicletas: clientes, órdenes de trabajo, inventario, cotizaciones y agenda.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} ${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full">
        <WorkshopProvider>{children}</WorkshopProvider>
      </body>
    </html>
  );
}
