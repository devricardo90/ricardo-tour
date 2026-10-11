import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

// RT-47: default social preview (referenced explicitly by each public page's metadata via lib/seo/social-image.ts).
// Brand artwork only (the Owner's logo + the approved positioning line): no tour photography, so it carries no
// media-rights question (RT-79). Individual tour pages keep their own tour image.
const TAGLINE: Record<string, string> = {
  pt: "Passeios guiados no Rio de Janeiro",
  en: "Guided tours in Rio de Janeiro",
  es: "Tours guiados en Río de Janeiro",
};

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const logo = await readFile(path.join(process.cwd(), "public", "images", "ricardo-tour-logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F3EFE6",
          gap: 36,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={840} height={280} alt="" />
        <div style={{ fontSize: 44, color: "#171A1E", letterSpacing: 1 }}>{TAGLINE[locale] ?? TAGLINE.pt}</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
