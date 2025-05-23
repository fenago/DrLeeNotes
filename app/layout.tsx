import type { Metadata } from 'next';
import './globals.css';
import ConvexClientProvider from './ConvexClientProvider';
import Footer from '@/components/ui/Footer';
import Header from '@/components/ui/Header';
import { Toaster } from 'react-hot-toast';
import PlausibleProvider from 'next-plausible';

let title = 'AgenticNotes - Take notes with your voice';
let description = 'Generate action items from your notes in seconds';
let url = 'https://www.agenticnotes.com';
let ogimage = '/images/og-image.png';
let sitename = 'agenticnotes.com';

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title,
  description,
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    images: [ogimage],
    title,
    description,
    url: url,
    siteName: sitename,
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    images: [ogimage],
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <PlausibleProvider domain="usenotesgpt.com" />
      </head>
      <body>
        <ConvexClientProvider>
          <Header />
          {children}
          <Footer />
          <Toaster />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
