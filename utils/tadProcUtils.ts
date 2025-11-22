import { TADPROC, TADPROC_RESULT, TypoEFRuP, RuleResult } from "../store/processors/processor.interface"

export const handleTadProcResults = async (msg: any) => {
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
            if (result.id === "EFRuP@1.0.0") {
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
    console.log("TadProc Results Error: ", err)
  }
}