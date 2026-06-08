import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Toaster } from '@/components/ui/toaster';
import { PUBLIC_SITE_URL } from "@/lib/public-site-url";

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_SITE_URL),
  title: "Rick Travel — City Tour no Rio",
  description: "Guided tours, local tourism experiences, and traveler support in Rio de Janeiro, Brazil. Support in Portuguese, Spanish, and English.",
  authors: [{ name: "Rick Travel" }],
  keywords: ["turismo", "rio de janeiro", "city tour", "guided tours", "local tourism", "traveler support"],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: PUBLIC_SITE_URL,
    title: "Rick Travel | City Tour no Rio de Janeiro",
    description: "Guided tours, local tourism experiences, and traveler support in Rio de Janeiro, Brazil.",
    siteName: "Rick Travel",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "City Tour no Rio de Janeiro - Rick Travel",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rick Travel | City Tour no Rio',
    description:
      'Guided tours and local tourism experiences in Rio de Janeiro, Brazil.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.ricktravel.com" />
        <link rel="dns-prefetch" href="https://api.ricktravel.com" />
      </head>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster />
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
