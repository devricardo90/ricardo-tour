import { expect, test } from "@playwright/test";

test.setTimeout(90_000);

test("opens the AI Concierge, sends a message, and renders the mocked response", async ({
  page,
}) => {
  await page.route("**/api/ai-concierge", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.continue();
  });

  await page.goto("/pt/contato");

  await expect(page.getByTestId("ai-concierge-entry")).toBeVisible();
  await page.getByTestId("ai-concierge-entry").click();
  await expect(page.getByTestId("ai-concierge-panel")).toBeVisible();

  await page
    .getByTestId("ai-concierge-input")
    .fill("Quero um passeio de meio dia no Rio");

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/ai-concierge") &&
      response.request().method() === "POST",
    { timeout: 45_000 }
  );

  await page.getByTestId("ai-concierge-send").click();

  await expect(page.getByTestId("ai-concierge-loading")).toBeVisible();
  await expect(page.getByTestId("ai-concierge-user-message")).toContainText(
    "Quero um passeio de meio dia no Rio"
  );
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  await expect(page.getByTestId("ai-concierge-assistant-message")).toContainText(
    "resposta inicial simulada",
    { timeout: 15_000 }
  );
  await expect(page.getByTestId("ai-concierge-assistant-message")).toContainText(
    "precos, disponibilidade, pagamento"
  );

  await page.screenshot({
    path: "test-results/ai-concierge-success.png",
    fullPage: true,
  });
});
