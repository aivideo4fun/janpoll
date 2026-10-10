import './globals.css';
import type { Metadata, Viewport } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Providers from './providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://janpoll.in'),
  title: 'JanPoll — राजस्थान की सबसे भरोसेमंद पब्लिक पोलिंग वेबसाइट',
  description: 'राजस्थान के मुद्दों और चुनावों पर अपनी राय दें। Rajasthan public opinion poll, political surveys, and secure voting platform.',
  keywords: [
    'Rajasthan public opinion poll',
    'Rajasthan political survey online',
    'JanPoll Rajasthan',
    'राजस्थान चुनावी सर्वे',
    'राजस्थान की जनता की राय',
    'online voting poll India',
  ],
  alternates: {
    canonical: 'https://janpoll.in',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: 'JanPoll — आपकी राय, जनता की आवाज़',
    description: 'राजस्थान के लोगों की राय जानिए और अपनी राय दें।',
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
      <head>
        {/* Google AdSense Script (सुरक्षित रखा गया है) */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4603205178906314"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#111827] antialiased">
        <Providers>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </Providers>

        {/* Infolinks Ads Script */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              var infolinks_pid = 3448527;
              var infolinks_wsid = 0;
            `,
          }}
        />
        <script
          type="text/javascript"
          src="https://resources.infolinks.com/js/infolinks_main.js"
          async
        />
      </body>
    </html>
  );
}