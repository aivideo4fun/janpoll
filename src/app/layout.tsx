import AnnouncementBar from '@/components/AnnouncementBar';
import AnalyticsConsent from '@/components/AnalyticsConsent';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Providers from './providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://janpoll.in'),
  title: 'JanPoll India — Voice of People',
  description: 'अपने राज्य और स्थानीय मुद्दों पर राय दें। JanPoll India एक स्वतंत्र public opinion मंच है।',
  keywords: ['JanPoll India', 'जनमत पोल', 'public opinion India', 'state polls', 'Rajasthan public opinion'],
  alternates: {
    canonical: './',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: 'JanPoll — Voice of People',
    description: 'भारत के राज्यों और स्थानीय मुद्दों पर लोगों की राय जानिए।',
    url: 'https://janpoll.in',
    siteName: 'JanPoll',
    locale: 'hi_IN',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#047857',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi">
      <body className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#111827] antialiased">
        <Providers>
          <Navbar />
          <AnnouncementBar />
          <div className="flex-grow">{children}</div>
          <Footer />
          <AnalyticsConsent />
        </Providers>

      </body>
    </html>
  );
}