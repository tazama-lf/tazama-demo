import { error } from "./../node_modules/@storybook/builder-webpack5/node_modules/babel-loader/node_modules/ajv/lib/vocabularies/applicator/dependencies"
// export const sentanceCase = (text: string) => {
//   return text.toLowerCase().replace(/(^|\s)\w/g, (m, p) => m.toUpperCase())
// }

import { Conditions } from "store/processors/processor.interface"

export const sentanceCase = (text: string) => {
  let upper = true
  let newStr = ""
  for (let i = 0, l = text.length; i < l; i++) {
    if (text[i] == " ") {
      upper = true
      newStr += " "
      continue
    }
    newStr += upper ? text[i]?.toUpperCase() : text[i]?.toLowerCase()
    upper = false
  }
  return newStr
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
    let fullDate = dtStr.split("T")[0]
    let time = dtStr.split("T")[1]?.split(".")[0]
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
      hrs = Math.ceil(parseInt(hrs) + 2)
      chDt = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hrs, min, sec).toISOString()
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
  if (data.length == 1) {
    let res_data: any[] = []
    let first_string = `${data[0]}`

    res_data.push(first_string)
    return res_data
  } else if (data.length == 2) {
    let res_data: any[] = []
    let first_string = `${data[0]} ${data[1]} `

    res_data.push(first_string)

    return res_data
  } else if (data.length == 3) {
    let res_data: any[] = []
    let first_string = `${data[0]} ${data[1]} `
    let second_string = `${data[2]} `
    res_data.push(first_string)
    res_data.push(second_string)
    return res_data
  } else {
    let res_data: any[] = []
    let first_string = `${data[0]} ${data[1]} `
    let second_string = `${data[2]} ${data[3]} `
    res_data.push(first_string)
    res_data.push(second_string)
    return res_data
  }
}

export const displayDate = (inDate: string) => {
  let date: any
  let time: any
  if (inDate.split("T")[0] !== undefined && inDate.split("T")[1] !== undefined) {
    date = inDate.split("T")[0]
    if (inDate.split("T")[1]?.includes(".")) {
      time = inDate.split("T")[1]?.split(".")[0]
    } else if (inDate.split("T")[1]?.includes("+")) {
      time = inDate.split("T")[1]?.split("+")[0]
    } else if (inDate.split("T")[1]?.includes("-")) {
      time = inDate.split("T")[1]?.split("-")[0]
    }
  } else {
    date = ""
  }

  return `${date} ${time}`
}

export const convertCheckDate = (inDate: string) => {
  let date: any
  let time: any
  if (inDate.split("T")[0] !== undefined && inDate.split("T")[1] !== undefined) {
    date = inDate.split("T")[0]
    if (inDate.split("T")[1]?.includes(".")) {
      time = inDate.split("T")[1]?.split(".")[0]
    } else if (inDate.split("T")[1]?.includes("+")) {
      time = inDate.split("T")[1]?.split("+")[0]
    } else if (inDate.split("T")[1]?.includes("-")) {
      time = inDate.split("T")[1]?.split("-")[0]
    }
  } else {
    date = ""
  }

  return `${date}T${time}.000Z`
}

export const ValidateCondition = async (condition: Conditions) => {
  const dt = new Date().toUTCString()
  let errors: string[] = []

  if (condition.condTp === "") {
    let errorMsg: string = "condTp"
    errors.push(errorMsg)
  }

  if (condition.evtTp.length === 0) {
    let errorMsg: string = "evtTp"
    errors.push(errorMsg)
  }

  if (condition.condRsn === "") {
    let errorMsg: string = "condRsn"
    errors.push(errorMsg)
  }

  if (condition.incptnDtTm === "") {
    let errorMsg: string = "incptnDtTm"
    errors.push(errorMsg)
  }

  if (condition.prsptv === "") {
    let errorMsg: string = "prsptv"
    errors.push(errorMsg)
  }

  return errors
}

interface DateObject {
  getTime(): number
  getTimezoneOffset(): number
  setUTCDate(year: number, month: number, day: number): void
  toISOString(): string
}

export const convertToGmtPlus2 = (dateStr: string): string => {
  /**
   * Converts an ISO string date to GMT +02:00.
   *
   * @param {string} dateStr - The date string in ISO format (e.g., '2022-07-26T14:30:00+00:00')
   * @returns {string} The converted date string in GMT +02:00 format
   */
  // Parse the date string
  const date: DateObject = new Date(dateStr)

  // Set the timezone to GMT +00:00
  const gmtDate = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000)

  // Convert to GMT +02:00
  const gmtPlus2Date = new Date(gmtDate.getTime() + 7200000 * 2) // Add 2 hours

  // Format the date string
  const gmtPlus2DateStr = gmtPlus2Date.toISOString()

  return gmtPlus2DateStr
}

export const handleDateTimeChange = (dateString: string) => {
  let localDateTime = ""
  let UTCOffsetDateTime = ""
  const inputValue = dateString
  localDateTime = inputValue
  // setLocalDateTime(inputValue);

  // If input is not empty, convert to UTC offset format
  if (inputValue) {
    // Create a date object from the local datetime-local input
    const localDate = new Date(inputValue)

    // Get the timezone offset in minutes
    const timezoneOffset = localDate.getTimezoneOffset()

    // Create a new date with the offset applied
    const offsetDate = new Date(localDate.getTime() - timezoneOffset * 60000)

    // Format to ISO string with UTC offset
    const formattedDateTime =
      offsetDate.toISOString().slice(0, 19) + (timezoneOffset === 0 ? "Z" : formatOffset(timezoneOffset))

    // setUTCOffsetDateTime(formattedDateTime);
    UTCOffsetDateTime = formattedDateTime
  }
  return UTCOffsetDateTime
}

// Helper function to format timezone offset
const formatOffset = (offsetMinutes: number) => {
  // Convert offset to hours and minutes
  const sign = offsetMinutes > 0 ? "-" : "+"
  const absOffset = Math.abs(offsetMinutes)
  const hours = Math.floor(absOffset / 60)
  const minutes = absOffset % 60

  // Format as +/-HH:MM
  return `${sign}${padZero(hours)}:${padZero(minutes)}`
}

// Helper to pad single digits with zero
const padZero = (num: number) => num.toString().padStart(2, "0")

export const toLocalISOString = (isoString?: string): string => {
  // Use provided ISO string or current time
  const date = isoString ? new Date(isoString) : new Date()

  // Get timezone offset in minutes
  const timezoneOffset = date.getTimezoneOffset()

  // If offset is 0, return with 'Z'
  if (timezoneOffset === 0) {
    return date.toISOString()
  }

  // Calculate offset sign and absolute hours/minutes
  const sign = timezoneOffset > 0 ? "-" : "+"
  const absOffset = Math.abs(timezoneOffset)
  const offsetHours = Math.floor(absOffset / 60)
  const offsetMinutes = absOffset % 60

  // Format offset
  const formattedOffset = `${sign}${offsetHours.toString().padStart(2, "0")}:${offsetMinutes
    .toString()
    .padStart(2, "0")}`

  // Replace 'Z' with formatted offset
  const isoStringWithOffset = date.toISOString().replace("Z", formattedOffset)

  return isoStringWithOffset
}

function adjustUTCTimeByOffset(utcTimestamp: string, additionalHours: number = 0) {
  // Parse the input UTC timestamp
  const inputDate = new Date(utcTimestamp)

  // Get timezone offset in minutes
  const timezoneOffset = inputDate.getTimezoneOffset()

  // Convert timezone offset to hours
  const offsetHours = -timezoneOffset / 60

  // Create a new date object, adding timezone offset and additional hours
  const adjustedDate = new Date(inputDate.getTime())
  adjustedDate.setUTCHours(inputDate.getUTCHours() + offsetHours + additionalHours)

  // Convert back to ISO string
  return adjustedDate.toISOString()
}

export const handleAdjustTime = (inputTimestamp: string) => {
  // let inputTimestamp = '2025-03-05T08:00:00.000Z'
  let additionalHours = 0
  let adjustedTimestamp = ""
  let timezoneOffset = ""
  const adjustedTime = adjustUTCTimeByOffset(inputTimestamp, additionalHours)
  adjustedTimestamp = adjustedTime

  // Calculate and display timezone offset
  const inputDate = new Date(inputTimestamp)
  const offsetMinutes = inputDate.getTimezoneOffset()
  const offsetHours = -offsetMinutes / 60

  timezoneOffset = `${offsetHours >= 0 ? "+" : ""}${offsetHours} hours`
  return adjustedTimestamp
}
