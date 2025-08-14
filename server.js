const frms = require("@tazama-lf/frms-coe-lib/lib/helpers/protobuf")
const NATS = require("nats")
const next = require("next")
require("dotenv").config()

const { Server } = require("socket.io")
const { createServer } = require("http")
const { parse } = require("url")

const app = next({ dev: process.env.NODE_ENV !== "production", customServer: true, quiet: false, turbo: true })

let natsUrl = { url: null }

const port = process.env.PORT

const handle = app.getRequestHandler()

const handleMsg = async (msg, socket, room) => {
  const decodedMessage = frms.default.decode(msg.data)

  await socket.to(room).emit(room, decodedMessage)
}
const handleMsg1 = async (msg, socket, room) => {
  const decodedMessage = frms.default.decode(msg.data)
  console.log("TADPROC: ", decodedMessage)
  await socket.to(room).emit(room, decodedMessage)
}

const handleMsg2 = async (msg, socket, room) => {
  const decodedMessage = frms.default.decode(msg.data)
  console.log("INT_SRVC: ", decodedMessage)
  await socket.to(room).emit(room, decodedMessage)
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(server, {
    transports: ["websocket", "polling"],
  })

  const NATSSubscriptions = []
  io.on("connect", (socket) => console.log("CONNECT", socket.id))
  let roomsList = [
    "welcome",
    "confirmation",
    "subscriptions",
    "ruleRequest",
    "ruleResponse",
    "typoRequest",
    "typoResponse",
    "tadProc",
    "stream",
    "ui_config",
    "cms",
    "interdiction-service",
  ]

  io.on("connection", async (socket) => {
    socket.join([...roomsList])
    console.log("Client connected", socket.id)
    socket.emit("welcome", { message: "NATS Connected" })

    socket.on("confirmation", (message) => {
      console.log("Confirmed:", message)
    })

    socket.on("uiconfig", (config) => {
      if (config !== null && config !== undefined) {
        natsUrl.url = config.cmsNatsHosting
      }
    })

    socket.on("subscriptions", (message) => {
      message.subscriptions.forEach((subscription) => {
        if (!NATSSubscriptions.includes(subscription)) {
          NATSSubscriptions.push(subscription)
        }
      })
    })

    socket.on("tadProc", (message) => {
      // Emit message to all subscribed clients
      console.log("TADPROC_RESULT: ", message)
      io.to("tadProc").emit("tadProc", message)
    })

    // Connect to NATS server

    const nc = await NATS.connect({
      servers: natsUrl.url,
      // ADD USER AND PASSWORD
    })

    let subscriptions = []

    NATSSubscriptions.forEach((sub) => {
      let subscription = nc.subscribe(sub, { queue: "MONITORING" })
      subscriptions.push(subscription)
      if (sub === ">") {
        socket.emit("subscriptions", `Subscribed to all rules`)
      } else {
        socket.emit("subscriptions", `Subscribed to ${sub}`)
      }
    })

    console.log("NATS Server Info: ", nc.info)

    const connected = nc.subscribe("connection")
    // const all = nc.subscribe(">", { queue: "MONITORING1" })
    const cms = nc.subscribe("cms", { queue: "MONITORING_CMS1" })
    const int_service = nc.subscribe("interdiction-service", { queue: "MONITORING_IS1" })

    ;(async () => {
      for await (const msg of connected) await handleMsg(msg, io, "connection")
    })()
    ;(async () => {
      for await (const msg of cms) await handleMsg1(msg, io, "tadProc")
    })()
    ;(async () => {
      for await (const msg of int_service) await handleMsg2(msg, io, "interdiction-service")
    })()

    io.to("stream").emit("stream", { message: "Stream Test Message" })

    socket.on("disconnect", () => {
      console.log("Client disconnected")
      return socket.disconnected
    })
  })

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })
})
