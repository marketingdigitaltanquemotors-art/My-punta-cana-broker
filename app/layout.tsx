import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({ variable: '--font-manrope', subsets: ['latin'] });
const cormorant = Cormorant_Garamond({ variable: '--font-cormorant', subsets: ['latin'], weight: ['500', '600', '700'], style: ['normal', 'italic'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'My Punta Cana Broker | Solares en Punta Cana-Bávaro',
  description: 'Encuentra solares en Punta Cana-Bávaro, simula tu plan de pago y agenda una visita con My Punta Cana Broker.',
  openGraph: { title: 'My Punta Cana Broker', description: 'Tu futuro empieza aquí. Solares y terrenos en Punta Cana-Bávaro.', images: ['/og.png'], type: 'website' },
  twitter: { card: 'summary_large_image', title: 'My Punta Cana Broker', description: 'Tu futuro empieza aquí.', images: ['/og.png'] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body className={`${manrope.variable} ${cormorant.variable}`}>{children}</body></html>;
}
