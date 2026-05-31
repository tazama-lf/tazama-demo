// SPDX-License-Identifier: Apache-2.0
import { convertToDate, iconColour, sentanceCase } from "utils/helpers"

// ---------------------------------------------------------------------------
// sentanceCase
// ---------------------------------------------------------------------------
describe("sentanceCase", () => {
  it("capitalises the first letter of each word", () => {
    expect(sentanceCase("hello world")).toBe("Hello World")
  })

  it("handles a single word", () => {
    expect(sentanceCase("tazama")).toBe("Tazama")
  })

  it("returns an empty string unchanged", () => {
    expect(sentanceCase("")).toBe("")
  })

  it("does not change words that are already title-cased", () => {
    expect(sentanceCase("Hello World")).toBe("Hello World")
  })

  it("lowercases letters that are not the first in a word", () => {
    expect(sentanceCase("HELLO WORLD")).toBe("Hello World")
  })
})

// ---------------------------------------------------------------------------
// iconColour
// ---------------------------------------------------------------------------
describe("iconColour", () => {
  it("returns text-blue-500 for index 0", () => {
    expect(iconColour(0)).toBe("text-blue-500")
  })

  it("returns text-green-500 for index 1", () => {
    expect(iconColour(1)).toBe("text-green-500")
  })

  it("returns text-yellow-400 for index 2", () => {
    expect(iconColour(2)).toBe("text-yellow-400")
  })

  it("returns text-orange-500 for index 3", () => {
    expect(iconColour(3)).toBe("text-orange-500")
  })

  it("returns text-blue-500 for any other index (default case)", () => {
    expect(iconColour(4)).toBe("text-blue-500")
    expect(iconColour(100)).toBe("text-blue-500")
    expect(iconColour(-1)).toBe("text-blue-500")
  })
})

// ---------------------------------------------------------------------------
// convertToDate
// ---------------------------------------------------------------------------
describe("convertToDate", () => {
  it("returns undefined for null input", () => {
    expect(convertToDate(null)).toBeUndefined()
  })

  it("returns undefined when the string has no time component", () => {
    expect(convertToDate("2024-06-15")).toBeUndefined()
  })

  it("returns an ISO date string for a valid ISO datetime", () => {
    const result = convertToDate("2024-06-15T10:30:00.000")
    expect(result).toBeDefined()
    expect(typeof result).toBe("string")
    // Verify the result is a valid ISO-8601 UTC string
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })

  it("adds 2 hours to the input time", () => {
    // Use a midday time to avoid date-rollover ambiguity across timezones
    const result = convertToDate("2024-06-15T12:00:00.000")
    expect(result).toBeDefined()
    const date = new Date(result!)
    // local Date constructor used inside convertToDate, so we compare local hours
    const localDate = new Date(2024, 5, 15, 14, 0, 0)
    expect(date.toISOString()).toBe(localDate.toISOString())
  })
})
