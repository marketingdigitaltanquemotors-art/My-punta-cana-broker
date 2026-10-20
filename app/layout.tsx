import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({ variable: '--font-manrope', subsets: ['latin'] });
const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
});

const siteUrl = 'https://broker.havelgo.com';
const homeTitle = 'Solares en Venta en Punta Cana y Bávaro | My Punta Cana Broker';
const homeDescription =
  'Descubre solares en venta en Punta Cana y Bávaro. Conoce opciones de financiamiento, ubicación y características. Agenda tu visita personalizada.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: homeTitle,
  description: homeDescription,
  alternates: { canonical: siteUrl },
  icons: {
    icon: '/my-punta-cana-broker-logo.jpeg',
    apple: '/my-punta-cana-broker-logo.jpeg',
  },
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    url: siteUrl,
    siteName: 'My Punta Cana Broker',
    locale: 'es_DO',
    type: 'website',
    images: [
      { url: '/og.png', width: 1672, height: 941, alt: 'My Punta Cana Broker' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: homeTitle,
    description: homeDescription,
    images: [{ url: '/og.png', alt: 'My Punta Cana Broker' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${manrope.variable} ${cormorant.variable}`}>
        {children}
      </body>
    </html>
  );
}
