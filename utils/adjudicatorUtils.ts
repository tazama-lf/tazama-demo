// SPDX-License-Identifier: Apache-2.0
import { RuleResult, TADPROC, TADPROC_RESULT, TypoEFRuP } from "../store/processors/processor.interface"

/**
 * Scans a raw network-map API response for the EFRuP rule and returns its
 * full id string (e.g. "EFRuP@1.0.0"), or `undefined` if no EFRuP rule is
 * found.
 *
 * @param networkMap - Raw response object from the /api/network-map BFF route.
 */
export function findEfrupId(networkMap: unknown): string | undefined {
  const mapData = (networkMap as any)?.data?.[0]
  if (!mapData?.messages) return undefined
  for (const message of mapData.messages) {
    for (const typology of message.typologies ?? []) {
      const efrupRule = (typology.rules ?? []).find((r: { id: string }) => r.id.split("@")[0] === "EFRuP")
      if (efrupRule) return efrupRule.id
    }
  }
  return undefined
}

/**
 * Parses a raw event-adjudicator NATS message into the UI TADPROC state shape.
 *
 * @param msg      - The decoded NATS message from the eventAdjudicator room.
 * @param efrupId  - The rule ID string that identifies the EFRuP rule
 *                   (e.g. "EFRuP@1.0.0"). When undefined, EFRuP detection is
 *                   skipped and no efrupResults are populated.
 */
export const handleAdjudicatorResults = async (msg: any, efrupId?: string) => {
  let result: any[] = []
  try {
    result.push(msg)
    if (result.length > 0) {
      let response: TADPROC = {
        status: result[0]?.report?.status,
        stop: false,
        color: "n",
        results: [],
        efrupResults: [],
      }
      if (result[0]?.report?.status === "NALT") {
        response.color = "g"
      } else if (result[0]?.report?.status === "ALRT") {
        response.color = "y"
      }
      let tr = result[0]?.report?.tadpResult?.typologyResult
      if (tr.length > 0) {
        tr.forEach((typoRes: any) => {
          let typoResult: TADPROC_RESULT = {
            cfg: typoRes.cfg,
            result: typoRes.result,
            efrup: undefined,
            workflow: {
              alertThreshold: null,
              interdictionThreshold: null,
            },
            ruleResults: [],
          }
          typoRes.ruleResults.forEach((result: RuleResult) => {
            if (efrupId !== undefined && result.id === efrupId) {
              typoResult.efrup = result.subRuleRef
              let typoEFRuP: TypoEFRuP = {
                typology: typoRes.cfg.split("@")[0],
                efrupResult: result.subRuleRef,
              }
              response.efrupResults.push(typoEFRuP)
            }
            typoResult.ruleResults.push(result)
          })
          typoResult.workflow.interdictionThreshold = typoRes.workflow.interdictionThreshold
            ? typoRes.workflow.interdictionThreshold
            : null
          typoResult.workflow.alertThreshold = typoRes.workflow.alertThreshold ? typoRes.workflow.alertThreshold : null
          if (typoResult.efrup !== undefined) {
            response.efrup = typoResult.efrup
          }
          if (typoResult.workflow.interdictionThreshold !== null) {
            if (typoRes.result >= typoResult.workflow.interdictionThreshold) {
              response.stop = true
              response.color = "r"
            }
          }
          response.results.push(typoResult)
        })
      }
      return response
    }
  } catch (err) {
    console.log("Adjudicator Results Error: ", err)
  }
}
