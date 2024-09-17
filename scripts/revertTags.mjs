import fs from "fs"
import readline from "readline"

const packagePath = "../package.json"
const dockerPath = "../docker-compose.dev.yml"

const updateFile = async (path, line, updatedLine) => {
  fs.readFile(path, "utf8", function (err, data) {
    if (err) {
      return console.log(err)
    }
    var result = data.replace(line, updatedLine)

    fs.writeFile(path, result, "utf8", function (err) {
      if (err) return console.log(err)
    })
  })
  console.log(`\n${path} version Update completed successfully!\n`)
}

const updatePackageFile = async () => {
  console.log("\nUpdating Application Version:")
  const file = readline.createInterface({
    input: fs.createReadStream(packagePath),
    output: process.stdout,
    terminal: false,
  })

  file.on("line", async (line) => {
    if (line.includes("version")) {
      let currentLine = line
      let newLine
      let oldVersion = line.split(" ")
      oldVersion = oldVersion[oldVersion.length - 1]

      let currentVersion = oldVersion.split('"')[1].split(".")

      const newVersion = []
      currentVersion.forEach((item) => {
        let number = parseInt(item)
        newVersion.push(number)
      })
      newVersion[2]--
      let buildVersion = `v${newVersion.join(".")}`

      newLine = currentLine.replace(oldVersion, `"${newVersion.join(".")}",`)
      await updateFile(packagePath, currentLine, newLine)
      console.log("Current Build Version:", `v${currentVersion.join(".")}`)
      console.log("New Build Version:", buildVersion)
      await updateDockerFile(buildVersion)
    }
  })
}

const updateDockerFile = async (buildV) => {
  console.log("\nUpdating Docker image Tag Version:")
  const file = readline.createInterface({
    input: fs.createReadStream(dockerPath),
    output: process.stdout,
    terminal: false,
  })

  file.on("line", async (line) => {
    if (line.includes("image: tazamaorg/demo-ui:")) {
      let currentLine = line

      let newLine
      let oldVersion = line.split(" ")
      oldVersion = oldVersion[oldVersion.length - 1]

      let currentVersion = oldVersion.split(":")[1]
      newLine = currentLine.replace(currentVersion, `${buildV}`)
      console.log("Old Docker Image Tag:", currentLine.split(" ")[5])
      console.log("New Docker Image Tag:", newLine.split(" ")[5])
      await updateFile(dockerPath, currentLine, newLine)
    }
  })
}
await updatePackageFile()
