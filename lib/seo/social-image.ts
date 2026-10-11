// RT-47: the default Open Graph / Twitter image for public pages (rendered by app/[locale]/og/route.tsx).
export function defaultSocialImages(locale: string) {
  return [{ url: `/${locale}/og`, width: 1200, height: 630, alt: "Ricardo Tour — Rio de Janeiro" }];
}
