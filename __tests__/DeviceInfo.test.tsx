// Red-phase tests for the DeviceInfo "transaction created" panel reset
// semantics (issue #132).
//
// When the user clicks "New Transaction" for a debtor, DeviceInfo renders a
// secondary panel containing Amount / Description / Purpose / Latitude /
// Longitude. The panel is gated by a component-local `isTransaction` flag and
// holds a local snapshot of the pacs008 payload. The flag must be cleared
// whenever the debtor displayed in the slot changes (e.g. Clear All clears
// entities, or one debtor is removed and a different one is added in the same
// slot). The current implementation keys the reset effect off the slot index
// only, so the flag persists across debtor swaps and the panel re-appears
// against the new debtor with the previous transaction's data.
//
// These tests pin down the desired behaviour and will fail until DeviceInfo
// keys its reset effect off the entity identity.

import { act, fireEvent, render, screen } from "@testing-library/react"
import React from "react"

import { DeviceInfo } from "../components/Device/DeviceInfo"
import EntityContext from "../store/entities/entity.context"
import { pacs002InitialState, pacs008InitialState } from "../store/entities/entity.initialState"
import type { CdtrEntity, Entity } from "../store/entities/entity.interface"
import ProcessorContext from "../store/processors/processor.context"
import { defaultConditionsData } from "../store/processors/processor.initialState"

const buildDebtor = (id: string): Entity =>
  ({
    Entity: {
      Dbtr: {
        Nm: "Debtor " + id,
        Id: {
          PrvtId: {
            DtAndPlcOfBirth: {
              BirthDt: "1994-08-11",
              CityOfBirth: "X",
              CtryOfBirth: "Y",
            },
            Othr: [{ Id: id, SchmeNm: { Prtry: "" } }],
          },
        },
        CtctDtls: { MobNb: "" },
      },
    },
    Accounts: [
      {
        DbtrAcct: {
          Id: { Othr: [{ Id: id + "-acct", SchmeNm: { Prtry: "" } }] },
          Nm: "Account " + id,
        },
      },
    ],
  }) as unknown as Entity

const buildCreditor = (id: string): CdtrEntity =>
  ({
    CreditorEntity: {
      Cdtr: {
        Nm: "Creditor " + id,
        Id: {
          PrvtId: {
            DtAndPlcOfBirth: {
              BirthDt: "1990-01-01",
              CityOfBirth: "X",
              CtryOfBirth: "Y",
            },
            Othr: [{ Id: id, SchmeNm: { Prtry: "" } }],
          },
        },
        CtctDtls: { MobNb: "" },
      },
    },
    CreditorAccounts: [
      {
        CdtrAcct: {
          Id: { Othr: [{ Id: id + "-acct", SchmeNm: { Prtry: "" } }] },
          Nm: "Creditor account " + id,
        },
      },
    ],
  }) as unknown as CdtrEntity

const buildEntityCtx = (entities: Entity[], creditorEntities: CdtrEntity[]) =>
  ({
    entities,
    creditorEntities,
    selectedDebtorEntity: {
      debtorSelectedIndex: 0,
      debtorAccountsLength: entities[0]?.Accounts.length ?? 0,
      debtorAccountSelectedIndex: 0,
    },
    selectedCreditorEntity: {
      creditorSelectedIndex: 0,
      creditorAccountsLength: creditorEntities[0]?.CreditorAccounts.length ?? 0,
      creditorAccountSelectedIndex: 0,
    },
    pacs008: pacs008InitialState,
    pacs002: pacs002InitialState,
    generateTransaction: async () => {},
  }) as unknown as React.ContextType<typeof EntityContext>

const buildProcessCtx = () =>
  ({
    conditionsDataDebtor: defaultConditionsData,
    conditionsDataCreditor: defaultConditionsData,
    update_debtor_active_section: () => {},
    update_creditor_active_section: () => {},
    setShowDebtorConditions: () => {},
    setShowCreditorConditions: () => {},
  }) as unknown as React.ContextType<typeof ProcessorContext>

function DebtorHarness({ entities, creditorEntities }: { entities: Entity[]; creditorEntities: CdtrEntity[] }) {
  return (
    <EntityContext.Provider value={buildEntityCtx(entities, creditorEntities)}>
      <ProcessorContext.Provider value={buildProcessCtx()}>
        <DeviceInfo selectedEntity={0} isDebtor setModalVisible={() => {}} setCreateModalVisible={() => {}} />
      </ProcessorContext.Provider>
    </EntityContext.Provider>
  )
}

// The transaction panel contains the static label "Description:" which does
// not appear anywhere else in the debtor branch of DeviceInfo, so its
// presence is a reliable signal that the panel is visible.
const isTransactionPanelVisible = () => Boolean(screen.queryByText(/^Description:/i))

const clickNewTransaction = async () => {
  const btn = screen.getByRole("button", { name: /new transaction/i })
  await act(async () => {
    fireEvent.click(btn)
  })
}

describe("DeviceInfo - transaction panel reset on entity-identity change (#132)", () => {
  it("does not render the transaction panel for a debtor that has not been transacted yet", () => {
    const debtorA = buildDebtor("debtor-a")
    const creditor = buildCreditor("creditor-1")
    render(<DebtorHarness entities={[debtorA]} creditorEntities={[creditor]} />)

    expect(isTransactionPanelVisible()).toBe(false)
  })

  it("renders the transaction panel after the user clicks New Transaction for the current debtor", async () => {
    const debtorA = buildDebtor("debtor-a")
    const creditor = buildCreditor("creditor-1")
    render(<DebtorHarness entities={[debtorA]} creditorEntities={[creditor]} />)

    await clickNewTransaction()

    expect(isTransactionPanelVisible()).toBe(true)
  })

  it("hides the transaction panel after Clear All clears entities and a new debtor is added in the same slot", async () => {
    const debtorA = buildDebtor("debtor-a")
    const debtorB = buildDebtor("debtor-b")
    const creditor = buildCreditor("creditor-1")

    const { rerender } = render(<DebtorHarness entities={[debtorA]} creditorEntities={[creditor]} />)

    await clickNewTransaction()
    expect(isTransactionPanelVisible()).toBe(true)

    // Simulate the header Clear All: entities array is emptied (the
    // entity guard hides the device while empty).
    rerender(<DebtorHarness entities={[]} creditorEntities={[creditor]} />)

    // The user then creates a brand new debtor, which lands in slot 0.
    rerender(<DebtorHarness entities={[debtorB]} creditorEntities={[creditor]} />)

    expect(isTransactionPanelVisible()).toBe(false)
  })

  it("hides the transaction panel when the debtor at the slot is replaced with a different debtor", async () => {
    const debtorA = buildDebtor("debtor-a")
    const debtorB = buildDebtor("debtor-b")
    const creditor = buildCreditor("creditor-1")

    const { rerender } = render(<DebtorHarness entities={[debtorA]} creditorEntities={[creditor]} />)

    await clickNewTransaction()
    expect(isTransactionPanelVisible()).toBe(true)

    // Same slot, different debtor identity. No Clear All in between.
    rerender(<DebtorHarness entities={[debtorB]} creditorEntities={[creditor]} />)

    expect(isTransactionPanelVisible()).toBe(false)
  })

  it("keeps the transaction panel visible while the same debtor remains in the slot", async () => {
    const debtorA = buildDebtor("debtor-a")
    const creditor1 = buildCreditor("creditor-1")
    const creditor2 = buildCreditor("creditor-2")

    const { rerender } = render(<DebtorHarness entities={[debtorA]} creditorEntities={[creditor1]} />)

    await clickNewTransaction()
    expect(isTransactionPanelVisible()).toBe(true)

    // An unrelated context change (e.g. the creditor list updated) must not
    // wipe the transaction panel for the debtor that just transacted.
    rerender(<DebtorHarness entities={[debtorA]} creditorEntities={[creditor2]} />)

    expect(isTransactionPanelVisible()).toBe(true)
  })
})
