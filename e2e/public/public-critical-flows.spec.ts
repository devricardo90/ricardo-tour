import { expect, test, type Page } from "@playwright/test";

// Read-only guarantee for form tests: every non-GET request is aborted, so even a client-validation regression (or a
// click before hydration) can never submit data — locally or against production.
async function blockWrites(page: Page) {
  await page.route("**/*", (route) => (route.request().method() === "GET" ? route.continue() : route.abort()));
}

const LOCALES = ["pt", "en", "es"] as const;

// Console noise that is not a product defect (dev-server HMR, third-party widgets).
function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/favicon|HMR|webpack-hmr|Download the React DevTools/i.test(m.text())) {
      errors.push(`console: ${m.text()}`);
    }
  });
  return errors;
}

for (const locale of LOCALES) {
  test.describe(`public site (${locale})`, () => {
    test("home renders with h1, html lang and no runtime errors", async ({ page }) => {
      const errors = collectErrors(page);
      const res = await page.goto(`/${locale}`);
      expect(res?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", new RegExp(`^${locale}`));
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
      expect(errors).toEqual([]);
    });

    test("home → tours listing → tour detail", async ({ page }) => {
      await page.goto(`/${locale}/tours`);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
      const firstTour = page.locator(`a[href^="/${locale}/tours/"]`).first();
      await expect(firstTour).toBeVisible();
      const href = await firstTour.getAttribute("href");
      await page.goto(href!);
      await expect(page).toHaveURL(new RegExp(`/${locale}/tours/.+`));
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    });

    test("about page renders", async ({ page }) => {
      const res = await page.goto(`/${locale}/quem-somos`);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    });

    test("contact page renders the form and blocks an empty submit", async ({ page }) => {
      await blockWrites(page);
      await page.goto(`/${locale}/contato`, { waitUntil: "networkidle" }); // hydrated, so client validation is active
      const form = page.getByTestId("contact-form");
      await expect(form).toBeVisible();
      await form.locator('button[type="submit"]').click();
      // Nothing may be sent for an empty form: at least one field is flagged invalid.
      await expect(form.locator('[aria-invalid="true"]').first()).toBeVisible();
    });
  });
}

test("unknown locale and unknown tour do not return 5xx", async ({ page }) => {
  const bad = await page.goto("/pt/tours/does-not-exist-rt44");
  expect(bad?.status()).toBeLessThan(500);
});

const ABOUT_LABEL = { pt: "Quem somos", en: "About us", es: "Quiénes somos" } as const;

// Header-scoped (the earlier page-wide check could be satisfied by links in the page body).
for (const locale of LOCALES) {
  test(`header "${ABOUT_LABEL[locale]}" opens the About page (${locale})`, async ({ page, isMobile }) => {
    await page.goto(`/${locale}/tours`);
    const header = page.getByRole("banner");
    if (isMobile) {
      await header.getByRole("button", { name: /menu|menú/i }).click();
    }
    const about = header.getByRole("link", { name: ABOUT_LABEL[locale], exact: true });
    await expect(about).toBeVisible();
    await about.click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/quem-somos$`));
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });
}

test("footer exposes contact channels and the institutional reference (pt)", async ({ page }) => {
  await page.goto("/pt");
  const footer = page.getByRole("contentinfo");
  await expect(footer.locator('a[href="/pt/contato"]')).toBeVisible();
  await expect(footer.locator('a[href^="mailto:contato@ricardotour.com"]')).toBeVisible();
  await expect(footer.locator('a[href^="https://wa.me/5522998461906"]')).toBeVisible();
  await expect(footer.getByRole("img", { name: "Cadastur" })).toBeVisible();
});

test("tour detail shows the request form and blocks an empty submit (pt)", async ({ page }) => {
  await page.goto("/pt/tours");
  const href = await page.locator('a[href^="/pt/tours/"]').first().getAttribute("href");
  await blockWrites(page);
  await page.goto(href!, { waitUntil: "networkidle" }); // hydrated, so client validation is active
  const form = page.getByTestId("tour-request-form");
  await expect(form).toBeVisible();
  await form.locator('button[type="submit"]').click();
  await expect(form.locator('[aria-invalid="true"]').first()).toBeVisible();
  await expect(page.getByTestId("tour-request-success")).toHaveCount(0);
});

// Option C (RT-91): the live planner is PT only; EN/ES are not published and PT /voos is a permanent redirect.
test("planner (pt) renders with its help channels; EN/ES are not published", async ({ page, request }) => {
  const res = await page.goto("/pt/planeje-sua-viagem");
  expect(res?.status()).toBe(200);
  await expect(page.locator("#planner-heading")).toBeVisible();
  await expect(page.locator('a[href^="https://wa.me/5522998461906"]').first()).toBeVisible();
  for (const locale of ["en", "es"]) {
    expect((await request.get(`/${locale}/planeje-sua-viagem`)).status()).toBe(404);
  }
  const voos = await request.get("/pt/voos", { maxRedirects: 0 });
  expect(voos.status()).toBe(308);
  expect(voos.headers()["location"]).toMatch(/\/pt\/planeje-sua-viagem$/);
});

// The Oner widget only renders its search form on an origin the provider has authorized (www.ricardotour.com);
// on localhost/previews its configuration call returns 500 and it shows "Não autorizado!" (RT-64 evidence).
// Run read-only against the production host: E2E_PLANNER_AUTHORIZED=1 PLAYWRIGHT_BASE_URL=https://www.ricardotour.com
test("planner booking engine renders its search form (authorized origin only)", async ({ page }) => {
  test.skip(process.env.E2E_PLANNER_AUTHORIZED !== "1", "provider authorizes by domain; set E2E_PLANNER_AUTHORIZED=1 on an authorized origin");
  await page.goto("/pt/planeje-sua-viagem");
  await expect(page.locator('[data-oner-status="ready"]')).toBeVisible({ timeout: 20_000 });
  const widget = page.locator("befly-widget");
  await expect(widget).toContainText(/Voos/, { timeout: 20_000 });
  await expect(widget).toContainText(/Hotéis/);
  await expect(widget.locator("input").first()).toBeVisible();
  await expect(widget.getByText("Buscar", { exact: true })).toBeVisible();
  await expect(widget).not.toContainText(/Não autorizado/);
});

test.describe("reduced motion", () => {
  // `reducedMotion` is a browser-context option, so it goes through contextOptions (a bare `use.reducedMotion` is ignored).
  test.use({ contextOptions: { reducedMotion: "reduce" } });
  test("home hero falls back to the static frame (RT-46)", async ({ page }) => {
    await page.goto("/pt");
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
    await expect(page.getByTestId("globe-journey")).toHaveAttribute("data-mode", "static");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });
});

test("keyboard: first Tab reveals the skip link, which moves to the main content (pt)", async ({ page, isMobile, browserName }) => {
  test.skip(isMobile, "keyboard flow is a desktop check");
  await page.goto("/pt/tours");
  if (browserName === "webkit") {
    // WebKit/Safari's default Tab order skips links (Option+Tab or the "Press Tab to highlight each item" setting
    // includes them), and Playwright cannot emulate Option+Tab here. Verified: Tab lands on the first form field.
    // So on WebKit the skip link's own behaviour is checked with programmatic focus; real Safari Tab is an RT-83 device check.
    await page.locator('a[href="#main-content"]').focus();
  } else {
    await page.keyboard.press("Tab");
  }
  const skip = page.locator(":focus");
  await expect(skip).toHaveAttribute("href", "#main-content");
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
  await page.keyboard.press("Tab");
  expect(await page.locator(":focus").evaluate((el) => Boolean(el.closest("main")))).toBe(true);
});

test("language switch keeps the user on the same page (tours)", async ({ page }) => {
  await page.goto("/pt/tours");
  await page.goto("/en/tours");
  await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
});

// Only meaningful against a server started WITHOUT the Daniela dev flag (e.g. `next start` of a default build).
// `npm run dev:daniela` enables the concierge on purpose, so the check is opt-in.
test("concierge API is closed on a default (flag-off) server", async ({ request }) => {
  test.skip(process.env.E2E_EXPECT_CONCIERGE_OFF !== "1", "set E2E_EXPECT_CONCIERGE_OFF=1 against a default-flag server");
  const res = await request.post("/api/ai-concierge", { data: { message: "oi" } });
  // Default-off / launch-guarded: must not answer with a model or mock reply.
  expect([403, 404, 405, 503]).toContain(res.status());
});

test("home exposes og:image and valid JSON-LD (RT-47)", async ({ page, request }) => {
  await page.goto("/pt");
  const ogImage = await page.locator('meta[property="og:image"]').first().getAttribute("content");
  expect(ogImage).toBeTruthy();
  const img = await request.get(new URL(ogImage!, page.url()).pathname);
  expect(img.status()).toBe(200);
  expect(img.headers()["content-type"]).toContain("image/png");
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent()) ?? "{}");
  expect(ld["@type"]).toBe("TravelAgency");
  expect(ld.name).toBe("Ricardo Tour");
});
