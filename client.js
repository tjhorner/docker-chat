const dgram = require('dgram')
const EventEmitter = require('events')

var randomId = () => {
  var text = ""
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

  for (var i = 0; i < 16; i++) text += possible.charAt(Math.floor(Math.random() * possible.length))

  return text
}

class DockerChatClient extends EventEmitter {
  constructor(name) {
    super()

    var self = this

    this.name = name
    this._clientId = randomId()
    this._client = dgram.createSocket("udp4")

    this._client.on("message", (msg, rinfo) => {
      self._handleMessage(msg, rinfo)
    })
  
    this._client.on("listening", () => {
      self._client.setBroadcast(true)

      self._client.send(JSON.stringify({
        clientId: self._clientId,
        type: "join",
        name: self.name
      }), 3030, "172.17.255.255")

      self.emit("connected")
    })
  
    this._client.bind(3030, "0.0.0.0")
  }

  _handleMessage(msg, rinfo) {
    var self = this

    try {
      if(Buffer.isBuffer(msg)) {
        var json = JSON.parse(msg.toString())
      } else if(typeof(msg) === "string") {
        var json = JSON.parse(msg)
      } else {
        var json = msg
      }

      // so we don't receive messages from ourselves
      if(json.clientId !== self._clientId) {
        switch(json.type) {
          case "msg":
            self.emit("message", { name: json.name, message: json.message })
            break
          case "join":
            self.emit("join", { name: json.name })
            break
        }
      }
    } catch(e) {
      self.emit("error", e)
    }
  }

  sendMessage(message) {
    this._client.send(JSON.stringify({
      clientId: this._clientId,
      type: "msg",
      name: this.name,
      message
    }), 3030, "172.17.255.255")
  }
}

module.exports = DockerChatClient