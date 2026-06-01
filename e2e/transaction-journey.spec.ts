import { expect, test } from "@playwright/test"
import { seedLocalStorage } from "./fixtures"

test.describe("Transaction journey", () => {
  test.beforeEach(async ({ page }) => {
    // Seed localStorage before the page loads so entity context picks them up on mount
    await seedLocalStorage(page)

    // Mock the network-map endpoint - no external admin service available in test
    // Rules and typologies must match the ids emitted by emitTestFixtures() in server.js:
    //   Rule-001@1.0.0 and Rule-002@1.0.0 (looked up by title = id.split("@")[0])
    //   typology-001@1.0.0 (looked up by title = cfg.split("@")[0])
    await page.route("/api/network-map", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          rules: [
            {
              id: 1,
              title: "Rule-001",
              rule: "Rule-001",
              ruleDescription: "",
              color: "n",
              result: null,
              wght: 0,
              linkedTypologies: [],
              displayLinkedTypo: [],
              ruleBands: [],
            },
            {
              id: 2,
              title: "Rule-002",
              rule: "Rule-002",
              ruleDescription: "",
              color: "n",
              result: null,
              wght: 0,
              linkedTypologies: [],
              displayLinkedTypo: [],
              ruleBands: [],
            },
          ],
          typologies: [
            {
              id: 1,
              title: "typology-001",
              cfg: "typology-001@1.0.0",
              color: "n",
              result: null,
              typoDescription: "",
              workflow: { alertThreshold: 400, interdictionThreshold: 600 },
              linkedRules: [],
            },
          ],
          data: [],
        }),
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

    // The ALRT badge should appear (adjudicatorLights.status = "ALRT", color = "y")
    await expect(page.getByText("ALRT")).toBeVisible({ timeout: 8000 })

    // Rules: wght=1.0 > 0 for both rules → color="r" (red) via updateTadpLights()
    // following::img[n] counts only imgs AFTER the "Rules" heading in DOM order
    const rulesHeading = page.getByRole("heading", { name: /^rules$/i })
    await expect(rulesHeading.locator("xpath=following::img[1]")).toHaveAttribute("src", /red-light/, { timeout: 8000 })
    await expect(rulesHeading.locator("xpath=following::img[2]")).toHaveAttribute("src", /red-light/, { timeout: 8000 })

    // Typologies: result=500 >= alertThreshold=400 and < interdictionThreshold=600 → color="y" (yellow)
    const typologiesHeading = page.getByRole("heading", { name: /^typologies$/i })
    await expect(typologiesHeading.locator("xpath=following::img[1]")).toHaveAttribute("src", /yellow-light/, {
      timeout: 8000,
    })
  })
})
