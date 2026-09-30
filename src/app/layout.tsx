import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'JanPoll — आपकी राय, जनता की आवाज़',
  description: 'राजस्थान के लोगों की राय जानिए और अपनी राय दें।',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi">
      <head>
        <meta name="google-adsense-account" content="ca-pub-4603205178906314" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#111827] antialiased">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}