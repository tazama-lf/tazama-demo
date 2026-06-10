/**
 * @jest-environment jsdom
 */
// SPDX-License-Identifier: Apache-2.0
process.env.SKIP_ENV_VALIDATION = "1"

import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import DropdownList from "components/Inputs/DropdownMenu"
import { newEntityConditionState } from "store/processors/processor.initialState"

// Item shape mirrors what the BFF route /api/conditions/config now returns.
const CONDITION_TYPE_OPTIONS = [
  { id: 0, option: "non-overridable-block" },
  { id: 1, option: "overridable-block" },
  { id: 2, option: "override" },
]

const PLACEHOLDER = "Select Condition Type"

describe("DropdownList (Condition Type)", () => {
  it("renders the placeholder (not the first option) when state.condTp is empty", () => {
    const onChange = jest.fn()

    render(
      <DropdownList
        options={CONDITION_TYPE_OPTIONS as any}
        state={{ ...newEntityConditionState, condTp: "" }}
        onChange={onChange}
        errors={[]}
        placeholder={PLACEHOLDER}
      />
    )

    expect(screen.getByRole("button", { name: new RegExp(PLACEHOLDER) })).toBeInTheDocument()
    // Must NOT display the first option as if it were selected.
    expect(screen.queryByRole("button", { name: /non-overridable-block/ })).not.toBeInTheDocument()
  })

  it("does not call onChange on mount (no implicit auto-selection)", () => {
    const onChange = jest.fn()

    render(
      <DropdownList
        options={CONDITION_TYPE_OPTIONS as any}
        state={{ ...newEntityConditionState, condTp: "" }}
        onChange={onChange}
        errors={[]}
        placeholder={PLACEHOLDER}
      />
    )

    expect(onChange).not.toHaveBeenCalled()
  })

  it("renders state.condTp as the button label when state already holds a value", () => {
    const onChange = jest.fn()

    render(
      <DropdownList
        options={CONDITION_TYPE_OPTIONS as any}
        state={{ ...newEntityConditionState, condTp: "override" }}
        onChange={onChange}
        errors={[]}
        placeholder={PLACEHOLDER}
      />
    )

    // The button reflects the parent's state, not options[0].
    expect(screen.getByRole("button", { name: /override/ })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: new RegExp(PLACEHOLDER) })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /non-overridable-block/ })).not.toBeInTheDocument()
  })

  it("calls onChange with the new condTp when an option is clicked", () => {
    const onChange = jest.fn()

    render(
      <DropdownList
        options={CONDITION_TYPE_OPTIONS as any}
        state={{ ...newEntityConditionState, condTp: "" }}
        onChange={onChange}
        errors={[]}
        placeholder={PLACEHOLDER}
      />
    )

    // Open the dropdown then pick "override".
    fireEvent.click(screen.getByRole("button", { name: new RegExp(PLACEHOLDER) }))
    fireEvent.click(screen.getByText("override"))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ condTp: "override" }))
  })

  it("renders all option labels in the menu so users can pick a value", () => {
    const onChange = jest.fn()

    render(
      <DropdownList
        options={CONDITION_TYPE_OPTIONS as any}
        state={{ ...newEntityConditionState, condTp: "" }}
        onChange={onChange}
        errors={[]}
        placeholder={PLACEHOLDER}
      />
    )

    expect(screen.getByText("non-overridable-block")).toBeInTheDocument()
    expect(screen.getByText("overridable-block")).toBeInTheDocument()
    expect(screen.getByText("override")).toBeInTheDocument()
  })
})
