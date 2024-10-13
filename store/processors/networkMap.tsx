import { useContext, useEffect, useState } from "react"
import { getNetworkMap } from "utils/db"
import ProcessorContext from "./processor.context"

async function getNetworkMapSetup() {
  const uiConfig: any = await localStorage.getItem("UI_CONFIG")

  let conf: any = uiConfig
  let con: any = JSON.parse(conf)

  const config: any = {
    url: con.arangoDBHosting,
    databaseName: "configuration",
    auth: { username: con.dbUser, password: con.dbPassword },
  }
  const res = await getNetworkMap(config)

  return res
}

export default getNetworkMapSetup
