import { useContext, useEffect, useState } from "react"

async function getNetworkMapSetup() {
  // Fetch network map from the API route
  const res = await fetch("/api/network-map")
  if (res.status === 401) throw new Error("UNAUTHORIZED")
  const data = await res.json()
  return data
}

export default getNetworkMapSetup
