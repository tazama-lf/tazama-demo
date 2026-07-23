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

    // ALERTS panel (replaces legacy EVENT ADJUDICATOR panel - spec §4, §6.5).
    // Before submission, all three sub-panel pills are rendered but EMPTY
    // (spec §4.2: "both elements persist across renders; the pill text is
    // blank on initial state / transaction reset"). The pill <p> element is
    // always present in the DOM regardless of label state - only the text
    // content is gated. The historical EVENT FLOW default of "NONE" was
    // dropped in favour of a uniformly blank initial state across all three
    // sub-panels (resolves §5.3 / §6.1 / §4.2 contradiction in favour of §4.2).
    const eventFlowPill = page.getByTestId("alerts-pill-event-flow")
    const typologyPill = page.getByTestId("alerts-pill-typology-processor")
    const adjudicatorPill = page.getByTestId("alerts-pill-event-adjudicator")

    await expect(eventFlowPill).toHaveText("")
    await expect(typologyPill).toHaveText("")
    await expect(adjudicatorPill).toHaveText("")

    // Click Send to submit the transaction
    const sendBtn = page.getByRole("button", { name: /^send$/i })
    await expect(sendBtn).toBeVisible()
    await sendBtn.click()

    // TEST_MODE server intercepts POST /api/transaction and ~500 ms later emits a
    // deterministic fixture set (server.js emitTestFixtures - spec §10 step 7b)
    // that drives all three ALERTS sub-panels to their non-default outcomes:
    //   - EVENT FLOW         -> "block"     (red BLOCK pill)     from the final EFRuP ruleResponse
    //   - TYPOLOGY PROCESSOR -> "interdict" (red INTERDICT pill) from the interdiction-service-tp fixture
    //   - EVENT ADJUDICATOR  -> "alrt"      (red ALRT pill)      from the eventAdjudicator fixture (status=ALRT)
    // The final state is deterministic regardless of socket.io listener order.
    await expect(eventFlowPill).toHaveText("BLOCK", { timeout: 8000 })
    await expect(typologyPill).toHaveText("INTERDICT", { timeout: 8000 })
    await expect(adjudicatorPill).toHaveText("ALRT", { timeout: 8000 })

    // Rules: wght=1.0 > 0 for both rules → color="r" (red) via updateTadpLights()
    // following::img[n] counts only imgs AFTER the "Rules" heading in DOM order
    const rulesHeading = page.getByRole("heading", { name: /^rules$/i })
    await expect(rulesHeading.locator("xpath=following::img[1]")).toHaveAttribute("src", /red-light/, { timeout: 8000 })
    await expect(rulesHeading.locator("xpath=following::img[2]")).toHaveAttribute("src", /red-light/, { timeout: 8000 })

    // Typologies analysis panel (NOT the ALERTS Typology Processor sub-panel):
    // result=500 >= alertThreshold=400 and < interdictionThreshold=600 → color="y" (yellow)
    const typologiesHeading = page.getByRole("heading", { name: /^typologies$/i })
    await expect(typologiesHeading.locator("xpath=following::img[1]")).toHaveAttribute("src", /yellow-light/, {
      timeout: 8000,
    })
  })
})
