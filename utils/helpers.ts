export const sentanceCase = (text: string) => {
  return text.toLowerCase().replace(/(^|\s)\w/g, (m, p) => m.toUpperCase())
}
