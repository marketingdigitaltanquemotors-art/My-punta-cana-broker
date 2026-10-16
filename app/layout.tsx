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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'My Punta Cana Broker | Solares en Punta Cana-Bávaro',
  description:
    'Solares en Punta Cana-Bávaro. Conoce los proyectos y agenda una visita con My Punta Cana Broker.',
  alternates: { canonical: siteUrl },
  icons: {
    icon: '/my-punta-cana-broker-logo.jpeg',
    apple: '/my-punta-cana-broker-logo.jpeg',
  },
  openGraph: {
    title: 'My Punta Cana Broker | Solares en Punta Cana-Bávaro',
    description:
      'Solares en Punta Cana-Bávaro. Conoce los proyectos y agenda una visita con My Punta Cana Broker.',
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
    title: 'My Punta Cana Broker | Solares en Punta Cana-Bávaro',
    description:
      'Solares en Punta Cana-Bávaro. Conoce los proyectos y agenda una visita con My Punta Cana Broker.',
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
