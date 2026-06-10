/**
 * @jest-environment jsdom
 */
// SPDX-License-Identifier: Apache-2.0

// Red tests for tazama-lf/tazama-demo#134:
//   D1: the datetime-local input inside the conditions row is controlled
//       (value=...) but has no `onChange` handler. React logs a
//       controlled-input warning whenever the value is a non-undefined string.
//   D2: the input only commits the typed value via `onBlur`, so a user who
//       types a date and clicks the X then Save without first tabbing out of
//       the input loses the date entirely.

// ─── Mocks (hoisted by Jest before imports) ──────────────────────────────────

jest.mock("ConditionsIndicator/ConditionIndicator", () => ({
  __esModule: true,
  ConditionIndicator: () => null,
}))

// ─── Imports ─────────────────────────────────────────────────────────────────

import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import ConditionsList from "components/Modal/ConditionsList"
import EntityContext from "store/entities/entity.context"
import ProcessorContext from "store/processors/processor.context"
import type { ListCondition } from "store/processors/processor.interface"

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ACCOUNT_CONDITION_NO_EXPIRY: ListCondition = {
  condId: "cond-account-noexpiry-001",
  condRsn: "Fraudulent Activity",
  condTp: "non-overridable-block",
  prsptv: "governed_as_debtor_account_by",
  evtTp: ["pacs.008.001.10"],
  creDtTm: "2025-01-01T00:00:00Z",
  incptnDtTm: "2025-01-01T00:00:00Z",
  xprtnDtTm: undefined,
  acct: {
    id: "acct-001",
    schmeNm: { prtry: "BBAN" },
    agt: { finInstnId: { clrSysMmbId: { mmbId: "bank-001" } } },
  },
} as any

// ─── Render helper ───────────────────────────────────────────────────────────

function renderWithCtx(overrides: Partial<{ expireCondition: jest.Mock }> = {}) {
  const expireCondition = overrides.expireCondition ?? jest.fn()
  const ctxValue: any = {
    expireCondition,
    getAllDebtorConditions: jest.fn(),
    getAllCreditorConditions: jest.fn(),
  }
  const utils = render(
    <EntityContext.Provider value={{} as any}>
      <ProcessorContext.Provider value={ctxValue as any}>
        <ConditionsList
          entity_type="debtor"
          activeDetails=""
          handleClose={jest.fn()}
          handleCreate={jest.fn()}
          conditions_data={[ACCOUNT_CONDITION_NO_EXPIRY]}
        />
      </ProcessorContext.Provider>
    </EntityContext.Provider>
  )
  return { ...utils, expireCondition }
}

function isControlledInputWarning(args: unknown[]): boolean {
  const first = args[0]
  if (typeof first !== "string") return false
  return /You provided a `value` prop to a form field without an `onChange` handler/.test(first)
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("ConditionsList datetime-local input (regression for #134)", () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it("does not log the React controlled-input warning after the user enters a date (D1)", () => {
    renderWithCtx()

    const input = document.getElementById("datetime") as HTMLInputElement
    expect(input).not.toBeNull()

    fireEvent.change(input, { target: { value: "2099-12-31T10:00" } })
    fireEvent.blur(input, { target: { value: "2099-12-31T10:00" } })

    const offendingCalls = consoleErrorSpy.mock.calls.filter(isControlledInputWarning)
    expect(offendingCalls).toHaveLength(0)
  })

  it("commits a typed expiry date on change (without requiring blur) so Save sends it to expireCondition (D2)", () => {
    const expireCondition = jest.fn()
    renderWithCtx({ expireCondition })

    const input = document.getElementById("datetime") as HTMLInputElement
    expect(input).not.toBeNull()

    // User types a future expiry date but does NOT blur the field.
    fireEvent.change(input, { target: { value: "2099-12-31T10:00" } })

    // User clicks the row's X (expire) button to open the ExpireModel.
    const rowExpireBtn = screen.getByTestId("row-expire-button")
    fireEvent.click(rowExpireBtn)

    // The ExpireModel is now visible. Click its "Save" button.
    fireEvent.click(screen.getByRole("button", { name: /Save/i }))

    expect(expireCondition).toHaveBeenCalledTimes(1)
    const call = expireCondition.mock.calls[0][0]
    expect(call).toMatchObject({
      type: "account",
      accountId: "acct-001",
      schmeNm: "BBAN",
      agt: "bank-001",
      condId: "cond-account-noexpiry-001",
    })
    // The exact value of xprtnDtTm depends on the local timezone offset
    // applied by handleAdjustTime, so assert only that the typed date round-
    // trips into the request (not that a date was supplied at all - which is
    // what the bug suppresses) by checking the year and month.
    expect(typeof call.xprtnDtTm).toBe("string")
    expect(call.xprtnDtTm).toMatch(/^2099-12-/)
  })
})
