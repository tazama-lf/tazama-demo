import { useEffect, useState } from "react"

export function TimeComponent() {
  const [currentTime, setCurrentTime] = useState<string>("")

  useEffect(() => {
    const updateTime = () => {
      const date = new Date()

      const hours = date.getHours().toString().padStart(2, "0")

      const minutes = date.getMinutes().toString().padStart(2, "0")

      setCurrentTime(`${hours}:${minutes}`)
    }

    const intervalId = setInterval(updateTime, 1000)

    updateTime()
    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="flex">
      <div className="py-1 pl-7 text-xs font-bold">{currentTime}</div>

      <div className="py-1 pl-7 text-xs font-bold"></div>
    </div>
  )
}
