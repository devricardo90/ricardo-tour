import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, isPublicLocale } from '@/i18n/routing';
import { Toaster } from '@/components/ui/toaster';
import { PUBLIC_SITE_URL } from "@/lib/public-site-url";

const baseMetadata: Metadata = {
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
  },
  twitter: {
    card: 'summary',
    title: 'Rick Travel | City Tour no Rio',
    description:
      'Guided tours and local tourism experiences in Rio de Janeiro, Brazil.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Swedish is a technical locale only (RT-57): routable, but never indexed or advertised.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (isPublicLocale(locale)) return baseMetadata;
  return { ...baseMetadata, robots: { index: false, follow: false } };
}

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
