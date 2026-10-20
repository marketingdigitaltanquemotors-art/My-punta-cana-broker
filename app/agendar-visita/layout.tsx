import type { Metadata } from 'next';

const siteUrl = 'https://broker.havelgo.com';
const bookingUrl = new URL('/agendar-visita', siteUrl).toString();
const title = 'Agenda tu visita en Punta Cana y Bávaro | My Punta Cana Broker';
const description =
  'Elige una fecha y un horario disponible para conocer solares en Punta Cana y Bávaro. Agenda tu visita personalizada con My Punta Cana Broker.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: bookingUrl },
  openGraph: {
    title,
    description,
    url: bookingUrl,
    siteName: 'My Punta Cana Broker',
    locale: 'es_DO',
    type: 'website',
    images: [
      {
        url: '/og.png',
        width: 1672,
        height: 941,
        alt: 'My Punta Cana Broker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [{ url: '/og.png', alt: 'My Punta Cana Broker' }],
  },
};

export default function ScheduleLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
