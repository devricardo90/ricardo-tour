import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";

// RT-RB-S9-01: official Ricardo Tour favicon is served in every locale.
const LOCALES = ["pt", "en", "es", "sv"] as const;
const VERCEL_DEFAULT_FAVICON_MD5 = "c30c7d42707a47a3f4591831641e50dc";

for (const locale of LOCALES) {
  test(`favicon links are present and served (${locale})`, async ({ page, request }) => {
    const res = await page.goto(`/${locale}`);
    expect(res?.status()).toBe(200);

    const hrefs = await page.locator('head link[rel~="icon"], head link[rel="apple-touch-icon"]').evaluateAll(
      (nodes) => nodes.map((n) => (n as HTMLLinkElement).href),
    );
    const paths = hrefs.map((h) => new URL(h).pathname);
    expect(paths.some((p) => p === "/favicon.ico"), "ico link").toBe(true);
    expect(paths.some((p) => /^\/icon(\.[^/.]+)?\.png$/.test(p)), "png icon link").toBe(true);
    expect(paths.some((p) => /apple-icon/.test(p)), "apple-touch-icon link").toBe(true);

    for (const href of hrefs) {
      const r = await request.get(href);
      expect(r.status(), href).toBe(200);
      expect(r.headers()["content-type"], href).toMatch(/image\//);
    }
  });
}

test("favicon.ico is not the Vercel default", async ({ request }) => {
  const r = await request.get("/favicon.ico");
  expect(r.status()).toBe(200);
  const md5 = createHash("md5").update(await r.body()).digest("hex");
  expect(md5).not.toBe(VERCEL_DEFAULT_FAVICON_MD5);
});
