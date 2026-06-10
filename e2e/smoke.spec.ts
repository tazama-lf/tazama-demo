import { expect, test } from "@playwright/test"

test.describe("Smoke tests", () => {
  test("page loads without console errors", async ({ page }) => {
    const errors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text())
    })

    await page.goto("/")
    // Wait for the Loader to disappear and the main content to appear
    await page.waitForSelector("text=Debtors", { timeout: 15000 })

    expect(errors).toHaveLength(0)
  })

  test("core panel headings are visible", async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("text=Debtors", { timeout: 15000 })

    await expect(page.getByText("Debtors").first()).toBeVisible()
    await expect(page.getByText("Creditors").first()).toBeVisible()
    // h2 headings have uppercase CSS - DOM text is mixed case
    await expect(page.getByRole("heading", { name: /event director/i })).toBeVisible()
    await expect(page.getByRole("heading", { name: /rules/i })).toBeVisible()
    await expect(page.getByRole("heading", { name: /typologies/i })).toBeVisible()
    // The legacy "Event Adjudicator" h2 panel has been replaced by the ALERTS panel
    // (spec §4, §6.5). The new panel's outer h2 is "Alerts" and contains three
    // h3 sub-panels titled "Event Flow", "Typology Processor", "Event Adjudicator".
    await expect(page.getByRole("heading", { name: /^alerts$/i })).toBeVisible()
    await expect(page.getByRole("heading", { name: /^event flow$/i })).toBeVisible()
    await expect(page.getByRole("heading", { name: /^typology processor$/i })).toBeVisible()
    await expect(page.getByRole("heading", { name: /^event adjudicator$/i })).toBeVisible()
  })
})
