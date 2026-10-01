import localFont from "next/font/local";

// Public-site typography foundation (RT-52). Cormorant Garamond for editorial/display headings, Inter for body and
// interface. The font files are application-owned (app/fonts, OFL licences alongside), not read from the documentation tree.
// The CSS variables below are the public API: --site-display and --site-body.
export const siteDisplay = localFont({
  src: "../../fonts/cormorant-garamond/latin.woff2",
  variable: "--site-display",
  weight: "300 700",
  display: "swap",
});

export const siteBody = localFont({
  src: "../../fonts/inter/latin.woff2",
  variable: "--site-body",
  weight: "100 900",
  display: "swap",
});
