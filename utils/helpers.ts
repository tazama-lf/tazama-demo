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
