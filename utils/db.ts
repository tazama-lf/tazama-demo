import {
  DBConfig,
  Rule,
  RuleBand,
  RuleConfig,
  RuleResult,
  TADPROC,
  TADPROC_RESULT,
  Typology,
} from "store/processors/processor.interface"

const { Database, aql } = require("arangojs")
require("dotenv").config()

// PASS ALL .ENV VARIABLES INTO THE FUNCTIONS FROM THE FE THAT COMES FROM THE LOCAL STORAGE

const getConfigConnection = (config: DBConfig) => {
  return new Database({
    url: config.url,
    databaseName: "configuration",
    auth: { username: config.auth.username, password: config.auth.password },
  })
}

const getTADPROCConnection = (config: any) => {
  // establish database connection
  return new Database({
    url: config.url,
    databaseName: "evaluationResults",
    auth: { username: config.auth.username, password: config.auth.password },
  })
}

const getCollection = async (cName: string, db: any) => {
  // get list of collections in database
  try {
    const collections = await db.collections()

    // check if collection exists, if so return collection, if not, create it
    if (collections.find((c: any) => c._name === cName)) {
      return await db.collection(cName)
    } else {
      return db.createCollection(cName)
    }
  } catch (err) {
    console.log(err)
  }
}

export const getRulesDescriptions = async (config: any) => {
  // make connection
  const db = getConfigConnection(config)
  // make sure rule collection exists
  await getCollection("ruleConfiguration", db)
  // declare array to hold rules
  let result = []
  // query for rules
  const results = await db.query(aql`FOR c IN ruleConfiguration RETURN c`)
  // loop through array cursor and push results in array
  for await (let rule of results) {
    result.push(rule)
  }

  const ruleConfig: any[] = []

  if (result.length > 0) {
    result.forEach((rule) => {
      let newRule: RuleConfig = {
        id: rule.id,
        title: rule.id.split("@")[0],
        description: rule.desc,
        bands: [],
      }

      rule.config.bands.forEach((band: any) => {
        let newBand: RuleBand = {
          subRuleRef: band.subRuleRef,
          lowerLimit: band.lowerLimit ? band.lowerLimit : null,
          upperLimit: band.upperLimit ? band.upperLimit : null,
          reason: band.reason,
        }
        newRule.bands.push(newBand)
      })

      ruleConfig.push(newRule)
    })
  }

  await db.close()

  return result
}

export const getTypologyDescriptions = async (config: DBConfig) => {
  // make connection
  const db: typeof Database = getConfigConnection(config)
  // make sure rule collection exists
  await getCollection("typologyConfiguration", db)
  // declare array to hold typologies
  let result = []
  // query for typologies
  const results: any = await db.query(aql`FOR c IN typologyConfiguration RETURN c`)
  // loop through array cursor and push results in array
  for await (let typology of results) {
    result.push(typology)
  }

  await db.close()

  return result
}

export const getTADPROCResult = async (transactionID: string, config: DBConfig) => {
  const db = getTADPROCConnection(config)
  await getCollection("transactions", db)

  let result = []
  try {
    const results = await db.query(aql`FOR c IN transactions FILTER c.transactionID == ${transactionID} RETURN c`)
    for await (let transaction of results) {
      result.push(transaction)
    }
    // db.close()
    if (result.length > 0) {
      let response: TADPROC = {
        status: result[0]?.report?.status,
        stop: false,
        color: "n",
        results: [],
      }
      // DOUBLE CHECK THIS LOGIC
      if (result[0]?.report?.status === "NALT") {
        response.color = "g"
      } else if (result[0]?.report?.status === "ALRT") {
        response.color = "y"
      }

      let tr = result[0]?.report?.tadpResult?.typologyResult
      // LOOP HERE
      if (tr.length > 0) {
        tr.forEach((typoRes: any) => {
          // new result object
          let typoResult: TADPROC_RESULT = {
            cfg: typoRes.cfg,
            result: typoRes.result,
            workflow: {
              alertThreshold: null,
              interdictionThreshold: null,
            },
            ruleResults: [],
          }
          // #################################################################################################
          // modify result object
          typoRes.ruleResults.forEach((result: RuleResult) => {
            typoResult.ruleResults.push(result)
          })

          typoResult.workflow.interdictionThreshold = typoRes.workflow.interdictionThreshold
            ? typoRes.workflow.interdictionThreshold
            : null

          typoResult.workflow.alertThreshold = typoRes.workflow.alertThreshold ? typoRes.workflow.alertThreshold : null

          // Add this somewhere else...

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

const getTypologyDetails = async (cfg: string, config: DBConfig) => {
  const db = getConfigConnection(config)
  await getCollection("typologyConfiguration", db)
  let result = []

  try {
    const results = await db.query(aql`FOR typo IN typologyConfiguration FILTER typo.cfg == ${cfg} RETURN typo`)

    for await (let typo of results) {
      result.push(typo)
    }

    await db.close()

    return result
  } catch (err) {
    console.log("Typology Details Error: ", err)
  }
}

export const getNetworkMap = async (config: DBConfig) => {
  const db = await getConfigConnection(config)
  await getCollection("networkConfiguration", db)

  let result = []
  const results = await db.query(aql`FOR c IN networkConfiguration FILTER c.active == true RETURN c`)
  await db.close()
  for await (let config of results) {
    result.push(config)
  }

  const typologiesRes: any[] = []
  const rulesRes: any[] = []

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
          }
          rulesRes.push(newRule)

          rulesRes.map(async (r) => {
            if (r.id === rule.id) {
              r.linkedTypologies.push(typology.cfg.split("@")[0])
            }
          })

          newTypology.linkedRules.push(newRule.title)
        })
        typologiesRes.push(newTypology)
      })
    })
  }
  const finalRules = []
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

  await getCollection("ruleConfiguration", db)
  const res = await db.query(aql`FOR c IN ruleConfiguration RETURN c`)
  const ruleData: any[] = []
  for await (let rule of res) {
    ruleData.push(rule)
  }
  finalRules.forEach(async (rule) => {
    const resRule = await ruleData.find((r) => r.id === rule.rule)
    if (result.length > 0) {
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

      typologiesRes.forEach(async (typology) => {
        if (typology.linkedRules.includes(rule.title)) {
          rule.linkedTypologies.push(typology.title)
        }
      })
    }
  })

  await getCollection("typologyConfiguration", db)
  const typoData: any[] = []

  const typoRes = await db.query(aql`FOR typo IN typologyConfiguration RETURN typo`)

  for await (let typo of typoRes) {
    typoData.push(typo)
  }

  typologiesRes.forEach(async (typology) => {
    const typo = await typoData.find((t) => t.cfg === typology.id)
    // let typo: any[] | undefined = await getTypologyDetails(typology.id, config)
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
  finalRules.sort((a, b) => a.title - b.title)
  typologiesRes.sort((a, b) => a.title - b.title)

  return {
    rules: finalRules,
    typologies: typologiesRes,
  }
}
