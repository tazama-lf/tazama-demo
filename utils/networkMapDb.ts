import { Rule, RuleBand, TypoEFRuP, Typology } from "store/processors/processor.interface"
import { pool } from "./pool"
import { getRulesDescriptions } from "./rulesDb"
import { getTypologyDescriptions } from "./typologiesDb"

export async function getNetworkMap() {
  const query = "SELECT configuration FROM network_map WHERE configuration->>'active' = 'true';"
  const { rows } = await pool.query(query)

  let result = []
  for await (let config of rows) {
    result.push(config.configuration)
  }

  const typologiesRes: any[] = []
  const rulesRes: any[] = []
  const typologiesEFRuP: TypoEFRuP[] = []

  if (result.length > 0) {
    result[0].messages.forEach((element: any) => {
      element.typologies.forEach((typology: any) => {
        let newTypology: Typology = {
          id: typology.cfg,
          title: typology.cfg.split("@")[0],
          color: "n",
          result: null,
          typoDescription: "",
          workflow: { interdictionThreshold: null, alertThreshold: null },
          linkedRules: [],
        }
        typology.rules.forEach(async (rule: Rule) => {
          let ruleId: any = rule.id.toString().split("@")[0]
          let newRule: Rule = {
            id: parseFloat(ruleId),
            title: ruleId,
            rule: rule.id.toString(),
            ruleDescription: "",
            color: "n",
            result: null,
            wght: 0,
            linkedTypologies: [],
            ruleBands: [],
            displayLinkedTypo: [],
          }
          if (rule.id.toString() === "EFRuP@1.0.0") {
            let typoEFRuP: TypoEFRuP = {
              typology: typology.cfg.split("@")[0],
              efrupResult: undefined,
            }
            typologiesEFRuP.push(typoEFRuP)
            let exists = rulesRes.filter((rule: Rule) => rule.title === "EFRuP")
            exists.length === 0 && rulesRes.push(newRule)
          } else {
            rulesRes.push(newRule)
          }
          newTypology.linkedRules.push(newRule.title)
        })
        typologiesRes.push(newTypology)
      })
    })
  }
  const finalRules: any[] = []
  for (let i = 0; i < rulesRes.length; i++) {
    let rule = rulesRes[i]
    let found = false
    for (let j = 0; j < finalRules.length; j++) {
      if (finalRules[j].id === rule.id) {
        found = true
        break
      }
    }
    if (!found) {
      finalRules.push(rule)
    }
  }

  const res = await getRulesDescriptions()
  const ruleData: any[] = []
  for await (let rule of res) {
    ruleData.push(rule)
  }
  finalRules.forEach(async (rule) => {
    const resRule = await ruleData.find((r) => r.id === rule.rule)
    if (result.length > 0) {
      const resRule1 = await ruleData.find((r) => r.rule === rule.rule)

      if (rule.title === "EFRuP") {
        rule.id = "EFRuP@1.0.0"
        rule.title = "EFRuP"
        rule.ruleDescription = "Event Flow Rule Processor"
      } else {
        rule.ruleDescription = resRule.desc
        if (resRule.config.hasOwnProperty("bands")) {
          resRule.config.bands.forEach((band: RuleBand) => {
            let newBand = {
              subRuleRef: band.subRuleRef,
              lowerLimit: band.lowerLimit ? band.lowerLimit : null,
              upperLimit: band.upperLimit ? band.upperLimit : null,
              reason: band.reason,
            }
            rule.ruleBands.push(newBand)
          })
        } else if (resRule.config.hasOwnProperty("cases")) {
          resRule.config.cases.forEach((item: RuleBand) => {
            let newBand: RuleBand = {
              subRuleRef: item.subRuleRef,
              lowerLimit: item.lowerLimit ? item.lowerLimit : null,
              upperLimit: item.upperLimit ? item.upperLimit : null,
              reason: item.reason,
            }
            rule.ruleBands.push(newBand)
          })
        }
        if (resRule.config.hasOwnProperty("exitConditions")) {
          resRule.config.exitConditions.forEach((item: RuleBand) => {
            let newCondition: RuleBand = {
              subRuleRef: item.subRuleRef,
              lowerLimit: item.lowerLimit ? item.lowerLimit : null,
              upperLimit: item.upperLimit ? item.upperLimit : null,
              reason: item.reason,
            }
            rule.ruleBands.push(newCondition)
          })
        }
      }
    }
  })

  const typoData: any[] = []
  const typoRes = await getTypologyDescriptions()

  for await (let typo of typoRes) {
    typoData.push(typo)
  }

  typologiesRes.forEach(async (typology) => {
    const typo = await typoData.find((t) => t.cfg === typology.id)

    if (typo !== undefined) {
      typology.typoDescription = typo.desc
      typology.workflow.interdictionThreshold = typo.workflow.hasOwnProperty("interdictionThreshold")
        ? typo.workflow.interdictionThreshold
        : null
      typology.workflow.alertThreshold = typo.workflow.hasOwnProperty("alertThreshold")
        ? typo.workflow.alertThreshold
        : null
    }
  })

  let ruleRes: Rule[] = finalRules.filter((item, index) => finalRules.indexOf(item) === index)
  finalRules.sort((a, b) => a.title - b.title)
  typologiesRes.sort((a, b) => a.title - b.title)

  let tfr = [...finalRules]
  let fin: number | undefined = undefined
  tfr.map((itm, index) => {
    if (itm.title === "EFRuP") {
      fin = index
    }
  })
  if (fin !== undefined) {
    finalRules.splice(fin, 1)
    finalRules.push(tfr[fin])
  }
  interface LinkListItem {
    rule: string
    linkedTypos: string[]
  }
  let ruleLinks: LinkListItem[] = []
  typologiesRes.map((typo: Typology) => {
    typo.linkedRules.map((linkedRule: string) => {
      let exists: LinkListItem | undefined = ruleLinks.find((link: LinkListItem) => {
        return link.rule === linkedRule
      })
      if (exists) {
        exists.linkedTypos.push(typo.title)
      } else {
        let ruleLink: LinkListItem = {
          rule: linkedRule,
          linkedTypos: [],
        }
        ruleLink.linkedTypos.push(typo.title)
        ruleLinks.push(ruleLink)
      }
    })
  })

  ruleLinks.map((link: LinkListItem) => {
    let exists: Rule | undefined = ruleRes.find((rule: Rule) => {
      return rule.title === link.rule
    })
    if (exists) {
      exists.displayLinkedTypo = [...link.linkedTypos]
    }
  })

  return {
    rules: ruleRes,
    typologies: typologiesRes,
    typologiesEFRuP: typologiesEFRuP,
  }
}
