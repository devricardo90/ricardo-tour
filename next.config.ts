import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // Optional isolated build dir so a production build can run next to a live dev server (RT-44/RT-45 audits).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    qualities: [75, 90],
  },
  async redirects() {
    // Public flight search moved to the Oner-widget travel planner (RT-91, Option C). 308 = permanent, method-preserving.
    // PT only: EN/ES /voos keep the RT-38 prototype until provider localization is confirmed. RT-38 code stays in the repo.
    return [{ source: "/pt/voos", destination: "/pt/planeje-sua-viagem", permanent: true }];
  },
};

export default withNextIntl(nextConfig);
