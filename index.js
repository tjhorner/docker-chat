const readline = require('readline')
const DockerChatClient = require('./client')

var rl = readline.createInterface(process.stdin, process.stdout)
var client

var consoleOut = msg => {
  process.stdout.clearLine()
  process.stdout.cursorTo(0)
  console.log(msg)
  rl.prompt(true)
}

rl.question("Welcome to Docker Chat! What do you want to be known by? ", res => {
  client = new DockerChatClient(res.trim())

  consoleOut("Connecting to peers...")
  
  client.on("connected", () => {
    consoleOut("Connected! Type to chat.")
  })

  client.on("message", msg => {
    consoleOut(`${msg.name}: ${msg.message}`)
  })

  client.on("error", e => [
    consoleOut("Error: " + e)
  ])

  rl.prompt(true)
})

rl.on("line", line => {
  if(client) {
    client.sendMessage(line.trim())
    rl.prompt(true)
  }
})