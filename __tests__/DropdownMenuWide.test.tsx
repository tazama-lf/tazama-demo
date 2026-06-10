/**
 * @jest-environment jsdom
 */
// SPDX-License-Identifier: Apache-2.0
process.env.SKIP_ENV_VALIDATION = "1"

import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import DropdownListWide from "components/Inputs/DropdownMenuWide"
import { newEntityConditionState } from "store/processors/processor.initialState"

// Item shape mirrors what the BFF route /api/conditions/config now returns.
const CONDITION_REASON_OPTIONS = [
  { id: 0, option: "Sanction Screening Exception" },
  { id: 1, option: "Fraudulent Activity" },
  { id: 2, option: "Suspicion of Money Laundering" },
]

const PLACEHOLDER = "Select Reason"

describe("DropdownListWide (Condition Reason)", () => {
  it("renders the placeholder (not the first option) when state.condRsn is empty", () => {
    const onChange = jest.fn()

    render(
      <DropdownListWide
        options={CONDITION_REASON_OPTIONS as any}
        state={{ ...newEntityConditionState, condRsn: "" }}
        onChange={onChange}
        placeholder={PLACEHOLDER}
      />
    )

    expect(screen.getByRole("button", { name: new RegExp(PLACEHOLDER) })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Sanction Screening Exception/ })).not.toBeInTheDocument()
  })

  it("does not call onChange on mount (no implicit auto-selection)", () => {
    const onChange = jest.fn()

    render(
      <DropdownListWide
        options={CONDITION_REASON_OPTIONS as any}
        state={{ ...newEntityConditionState, condRsn: "" }}
        onChange={onChange}
        placeholder={PLACEHOLDER}
      />
    )

    expect(onChange).not.toHaveBeenCalled()
  })

  it("renders state.condRsn as the button label when state already holds a value", () => {
    const onChange = jest.fn()

    render(
      <DropdownListWide
        options={CONDITION_REASON_OPTIONS as any}
        state={{ ...newEntityConditionState, condRsn: "Fraudulent Activity" }}
        onChange={onChange}
        placeholder={PLACEHOLDER}
      />
    )

    expect(screen.getByRole("button", { name: /Fraudulent Activity/ })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: new RegExp(PLACEHOLDER) })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Sanction Screening Exception/ })).not.toBeInTheDocument()
  })

  it("calls onChange with the new condRsn when an option is clicked", () => {
    const onChange = jest.fn()

    render(
      <DropdownListWide
        options={CONDITION_REASON_OPTIONS as any}
        state={{ ...newEntityConditionState, condRsn: "" }}
        onChange={onChange}
        placeholder={PLACEHOLDER}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: new RegExp(PLACEHOLDER) }))
    fireEvent.click(screen.getByText("Suspicion of Money Laundering"))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ condRsn: "Suspicion of Money Laundering" }))
  })

  it("renders all option labels in the menu so users can pick a value", () => {
    const onChange = jest.fn()

    render(
      <DropdownListWide
        options={CONDITION_REASON_OPTIONS as any}
        state={{ ...newEntityConditionState, condRsn: "" }}
        onChange={onChange}
        placeholder={PLACEHOLDER}
      />
    )

    expect(screen.getByText("Sanction Screening Exception")).toBeInTheDocument()
    expect(screen.getByText("Fraudulent Activity")).toBeInTheDocument()
    expect(screen.getByText("Suspicion of Money Laundering")).toBeInTheDocument()
  })
})
