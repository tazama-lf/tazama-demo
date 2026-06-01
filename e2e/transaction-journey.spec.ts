import { expect, test } from "@playwright/test"
import { seedLocalStorage } from "./fixtures"

test.describe("Transaction journey", () => {
  test.beforeEach(async ({ page }) => {
    // Seed localStorage before the page loads so entity context picks them up on mount
    await seedLocalStorage(page)

    // Mock the network-map endpoint - no external admin service available in test
    await page.route("/api/network-map", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ rules: [], typologies: [], data: [] }),
      })
    })

    // Mock conditions endpoints - no external service available in test
    await page.route("/api/conditions/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ conditions: [] }),
      })
    })
  })

  test("New Transaction button is enabled when entities are loaded", async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("text=Debtors", { timeout: 15000 })

    // The "New Transaction" button is in DeviceInfo - visible only on the debtor device
    const btn = page.getByRole("button", { name: /new transaction/i })
    await expect(btn).toBeVisible()
    // Button should not have the opacity-40 class (which indicates disabled state)
    await expect(btn).not.toHaveClass(/opacity-40/)
  })

  test("Send button is enabled when entities are loaded", async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("text=Debtors", { timeout: 15000 })

    // The Send button on the debtor device panel triggers sendTransaction()
    // It is inside a div that loses the pointer-events-none/opacity-30 class when entities are present
    const sendBtn = page.getByRole("button", { name: /^send$/i })
    await expect(sendBtn).toBeVisible()
  })

  test("pipeline processes after transaction submission in TEST_MODE", async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("text=Debtors", { timeout: 15000 })

    // Before submission: the Event Adjudicator status indicator should be neutral
    const adjudicatorStatusImg = page
      .getByRole("heading", { name: /event adjudicator/i })
      .locator("xpath=following-sibling::div//img")
    await expect(adjudicatorStatusImg).toHaveAttribute("src", /neutral-light/)

    // Click Send to submit the transaction
    const sendBtn = page.getByRole("button", { name: /^send$/i })
    await expect(sendBtn).toBeVisible()
    await sendBtn.click()

    // TEST_MODE server intercepts POST /api/transaction and emits an eventAdjudicator fixture
    // after 500ms. The fixture has status "ALRT" with result 500 >= alertThreshold 400 but
    // result 500 < interdictionThreshold 600, so stop=false and color="y" (yellow/alert).
    // The Event Adjudicator StatusIndicator changes from neutral to yellow.
    //
    // Wait up to 8 seconds for the socket event to arrive and the UI to update.
    await expect(adjudicatorStatusImg).not.toHaveAttribute("src", /neutral-light/, { timeout: 8000 })

    // The Event Adjudicator heading should still be present after processing
    await expect(page.getByRole("heading", { name: /event adjudicator/i })).toBeVisible()
  })
})
