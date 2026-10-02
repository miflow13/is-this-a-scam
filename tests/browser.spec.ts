import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const fixture = "tests/fixtures/delivery-fee.png";
const results = [
  ["likely_scam", "Likely scam"],
  ["uncertain", "I'm not sure"],
  ["no_obvious_red_flags", "No obvious red flags found"],
] as const;
for (const [verdict, label] of results)
  test(`renders ${verdict} and a cautious next step`, async ({ page }) => {
    await page.route("**/api/analyze", (route) =>
      route.fulfill({
        json: {
          verdict,
          summary: "It asks you to pay a fee.",
          redFlags:
            verdict === "no_obvious_red_flags"
              ? []
              : ["Unexpected payment request"],
          recommendedAction:
            "Don't use links in this message. Ask someone you trust.",
        },
      }),
    );
    await page.goto("/");
    await page.getByLabel("Choose a screenshot").setInputFiles(fixture);
    await page.getByRole("button", { name: "Check this message" }).click();
    await expect(
      page.getByRole("heading", { name: label, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("It asks you to pay a fee.")).toBeVisible();
    await expect(
      page.getByText(/does not prove legitimacy/).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "What to do next" }),
    ).toBeVisible();
    await expect(page.locator('a[href^="https://parcel"]')).toHaveCount(0);
  });
test("shows an upload error and lets the user recover", async ({ page }) => {
  await page.goto("/");
  await page
    .getByLabel("Choose a screenshot")
    .setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("hello"),
    });
  await expect(
    page.getByRole("alert", { name: "Screenshot checker error" }),
  ).toContainText("PNG");
  await page.getByLabel("Choose a screenshot").setInputFiles(fixture);
  await expect(
    page.getByRole("button", { name: "Check this message" }),
  ).toBeEnabled();
});
test("network failure can be retried", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/analyze", (route) =>
    ++attempts === 1
      ? route.abort()
      : route.fulfill({
          json: {
            verdict: "uncertain",
            summary: "The context is incomplete.",
            redFlags: [],
            recommendedAction: "Ask someone you trust.",
          },
        }),
  );
  await page.goto("/");
  await page.getByLabel("Choose a screenshot").setInputFiles(fixture);
  await page.getByRole("button", { name: "Check this message" }).click();
  await expect(
    page.getByRole("alert", { name: "Screenshot checker error" }),
  ).toContainText("try again");
  await page.getByRole("button", { name: "Check this message" }).click();
  await expect(
    page.getByRole("heading", { name: "I'm not sure" }),
  ).toBeVisible();
});
test("clearing or replacing an image prevents a stale result", async ({
  page,
}) => {
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  await page.route("**/api/analyze", async (route) => {
    await pending;
    await route
      .fulfill({
        json: {
          verdict: "likely_scam",
          summary: "OLD RESULT",
          redFlags: [],
          recommendedAction: "Ask someone you trust.",
        },
      })
      .catch(() => {});
  });
  await page.goto("/");
  await page.getByLabel("Choose a screenshot").setInputFiles(fixture);
  await page.getByRole("button", { name: "Check this message" }).click();
  await expect(
    page.getByRole("button", { name: "Reading your screenshot…" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Clear screenshot" }).click();
  await page
    .getByLabel("Choose a screenshot")
    .setInputFiles("tests/fixtures/ordinary-notification.png");
  finish();
  await expect(page.getByText("OLD RESULT")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Check this message" }),
  ).toBeEnabled();
});
test("supports native keyboard selection and analysis", async ({ page }) => {
  await page.route("**/api/analyze", (route) =>
    route.fulfill({
      json: {
        verdict: "uncertain",
        summary: "Not enough information.",
        redFlags: [],
        recommendedAction: "Ask someone you trust.",
      },
    }),
  );
  await page.goto("/");
  const choose = page.getByRole("button", {
    name: "Choose a screenshot",
    exact: true,
  });
  await choose.focus();
  const chooserPromise = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  await (await chooserPromise).setFiles(fixture);
  await page.getByRole("button", { name: "Check this message" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "I'm not sure" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear screenshot" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Check this message" }),
  ).toHaveCount(0);
});
test("accepts a real file drop and has no horizontal overflow or page errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const bytes = (await readFile(fixture)).toString("base64");
  const transfer = await page.evaluateHandle((encoded) => {
    const dt = new DataTransfer();
    dt.items.add(
      new File(
        [Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))],
        "delivery-fee.png",
        { type: "image/png" },
      ),
    );
    return dt;
  }, bytes);
  await page
    .getByTestId("drop-zone")
    .dispatchEvent("drop", { dataTransfer: transfer });
  await expect(page.getByAltText("Your selected screenshot")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
