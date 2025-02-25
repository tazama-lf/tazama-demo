export const sentanceCase = (text: string) => {
  return text.toLowerCase().replace(/(^|\s)\w/g, (m, p) => m.toUpperCase())
}

export const iconColour = (index: number) => {
  let fillColour = "text-blue-500"
  switch (index) {
    case 0: {
      return (fillColour = "text-blue-500")
    }
    case 1: {
      return (fillColour = "text-green-500")
    }
    case 2: {
      return (fillColour = "text-yellow-400")
    }
    case 3: {
      return (fillColour = "text-orange-500")
    }
    default: {
      return (fillColour = "text-blue-500")
    }
  }
}

export const convertToDate = (dtStr: string | null) => {
  let chDt = undefined
  if (dtStr !== null) {
    let time = dtStr.split(" ")[1]
    let dt = dtStr.split(" ")[0]
    let year = dt!.split("-")[0]
    let month = dt!.split("-")[1]
    let day = dt!.split("-")[2]

    let hrs: any = time?.split(":")[0]
    let min: any = time?.split(":")[1]
    let sec: any = time?.split(":")[2]

    if (
      hrs !== undefined &&
      min !== undefined &&
      sec !== undefined &&
      year !== undefined &&
      month !== undefined &&
      day !== undefined
    ) {
      chDt = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hrs, min, sec).getTime()
    }
  }
  return chDt
}

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

export const generateString = (length: number) => {
  let result = " "
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }

  return result
}

export const set_event_type = (data: string[]) => {
  const response = data.map((item) => {
    let res: string = ""
    if (res.length === 0) {
      res += item
      res += " "
    } else {
      res += ` ${item}`
    }
    return res
  })
  return response
}
