// ─── <ProcessIndicator /> tests (red phase, issue #129) ─────────────────────
//
// Spec re-derivation: the centre-lane dot trail no longer reads
// `adjudicatorLights.stop` / `adjudicatorLights.efrup` (legacy slice). It
// re-derives its colouring from the alerts slice via a single discriminated
// `mode` prop computed by the parent (app/(demo)/page.tsx) using
// `getIndicatorMode(eventFlow, typology)` from lib/stopOverlay.ts.
//
// Mode -> visual contract:
//   mode="stop"      -> all 9 dots red                        (issue #129 rule)
//   mode="override"  -> all 9 dots green                      (issue #129 rule)
//   mode="idle"      -> animated rotating green dot if started, else all neutral
//
// This file deliberately does NOT exercise the old `stop` / `efrup` props -
// those are being removed in the green phase.

import { render } from "@testing-library/react"
import React from "react"

import { ProcessIndicator } from "../components/ProcessIndicator/ProcessIndicator"
function countLightsByColour(): { r: number; g: number; n: number; y: number; b: number } {
  // next/image renders <img alt=""> which testing-library classifies as
  // role="presentation" (decorative), so getAllByRole("img") returns nothing.
  // Query the DOM directly instead.
  const imgs = Array.from(document.querySelectorAll("img")) as HTMLImageElement[]
  const counts = { r: 0, g: 0, n: 0, y: 0, b: 0 }
  for (const img of imgs) {
    if (img.src.includes("red-light")) counts.r += 1
    else if (img.src.includes("green-light")) counts.g += 1
    else if (img.src.includes("neutral-light")) counts.n += 1
    else if (img.src.includes("yellow-light")) counts.y += 1
    else if (img.src.includes("blue-light")) counts.b += 1
  }
  return counts
}

describe("<ProcessIndicator /> mode='stop' (#129)", () => {
  it("renders all 9 dots red regardless of `started`", () => {
    render(<ProcessIndicator started={true} mode="stop" />)
    const counts = countLightsByColour()
    expect(counts.r).toBe(9)
    expect(counts.g).toBe(0)
    expect(counts.n).toBe(0)
  })

  it("still renders red when `started` is false (mode wins over animation)", () => {
    render(<ProcessIndicator started={false} mode="stop" />)
    const counts = countLightsByColour()
    expect(counts.r).toBe(9)
  })
})

describe("<ProcessIndicator /> mode='override' (#129)", () => {
  it("renders all 9 dots green regardless of `started`", () => {
    render(<ProcessIndicator started={true} mode="override" />)
    const counts = countLightsByColour()
    expect(counts.g).toBe(9)
    expect(counts.r).toBe(0)
    expect(counts.n).toBe(0)
  })

  it("renders all 9 dots green even when `started` is false (override is an explicit verdict, not an animation state)", () => {
    render(<ProcessIndicator started={false} mode="override" />)
    const counts = countLightsByColour()
    expect(counts.g).toBe(9)
  })
})

describe("<ProcessIndicator /> mode='idle' (#129)", () => {
  // These two cases happen to pass against the current (pre-green-phase)
  // component because the existing logic for `!stop` / `!started` overlaps
  // with the new `mode='idle'` contract. They are NOT compatibility back-
  // doors - they pin the contract going forward, so the green-phase
  // rewrite cannot regress idle behaviour. The 5 failing tests in the
  // mode='stop' / mode='override' / prop-contract blocks are what proves
  // the implementation is gap-driven, not the absence of these two.
  it("renders 9 dots when `started` is true (animated trail; exact rotation tick is timing-dependent)", () => {
    render(<ProcessIndicator started={true} mode="idle" />)
    const imgs = document.querySelectorAll("img")
    expect(imgs.length).toBe(9)
    // No dot is red or override-green in idle mode.
    const counts = countLightsByColour()
    expect(counts.r).toBe(0)
  })

  it("renders 9 neutral dots when `started` is false (pre-transaction baseline)", () => {
    render(<ProcessIndicator started={false} mode="idle" />)
    const counts = countLightsByColour()
    expect(counts.n).toBe(9)
    expect(counts.r).toBe(0)
    expect(counts.g).toBe(0)
  })
})

describe("<ProcessIndicator /> prop contract (#129)", () => {
  // The legacy `stop` and `efrup` props are removed in this PR. TypeScript
  // is the primary guard, but adding a runtime check here catches the case
  // where a stale caller passes them as `any` (e.g. via spread) without
  // the type system flagging it. The component must IGNORE them and key
  // its render entirely on `mode`.
  it("ignores any legacy `stop` / `efrup` props if passed and keys render on `mode` alone", () => {
    // @ts-expect-error - legacy props removed from the interface
    render(<ProcessIndicator started={true} mode="idle" stop={true} efrup="block" />)
    const counts = countLightsByColour()
    // mode='idle' wins - no red dots even though stop=true was passed.
    expect(counts.r).toBe(0)
  })
})
