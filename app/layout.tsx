import type { Metadata } from "next";
import "./globals.css";
import { Fredoka, Nunito } from "next/font/google";
import { ModalProvider } from "./context/ModalContext";

// Configurar Fredoka (pesos 300-700)
const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

// Configurar Nunito (pesos 300-800)
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PETFY - Paseos y Servicios para Mascotas | Un Universo Peludo",
    template: "%s | PETFY"
  },
  description: "PETFY - Servicios de Paseos para Mascotas. GPS en vivo, paseador fijo, fotos y más.",
  keywords: ["mascotas", "perros", "paseos", "pet shop", "paseador", "GPS"],
  authors: [{ name: "Petfy" }],
  creator: "Petfy",
  publisher: "Petfy",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "PETFY - Paseos y Servicios para Mascotas | Un Universo Peludo",
    description: "PETFY - Servicios de Paseos para Mascotas. GPS en vivo, paseador fijo, fotos y más.",
    url: "https://petfy.com.co",
    siteName: "PETFY",
    images: [
      {
        url: "https://petfy.com/assets/img/og-image.png", // Cambia por tu dominio real
        width: 1200,
        height: 630,
        alt: "PETFY - Paseos para Mascotas",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PETFY - Paseos y Servicios para Mascotas | Un Universo Peludo",
    description: "PETFY - Servicios de Paseos para Mascotas. GPS en vivo, paseador fijo, fotos y más.",
    images: ["https://petfy.com/assets/img/og-image.png"], // Cambia por tu dominio real
  },
  icons: {
    icon: "/assets/img/IsotipoPetfy.png",
    apple: "/assets/img/IsotipoPetfy.png",
  },
  alternates: {
    canonical: "https://petfy.com.co",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${fredoka.variable} ${nunito.variable}`}>
            <head>
        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        {/* Favicon */}
        <link rel="icon" href="/assets/img/Logo-Petfy-renovado-2.png" type="image/x-icon" />
      </head>
      <body>

        {/*{children}*/}
        <ModalProvider>
          {children}
        </ModalProvider>

      </body>
    </html>
  );
}