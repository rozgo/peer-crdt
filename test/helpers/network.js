'use strict'

const virtualNetwork = require('./virtual-network')

const DEFAULT_BROADCAST_FREQ = 200

class Network {
  constructor (id, log, onRemoteHead, broadcastFrequency) {
    this._id = id
    this._log = log
    this._onRemoteHead = onRemoteHead
    this._broadcastFrequency = broadcastFrequency || DEFAULT_BROADCAST_FREQ

    this._head = undefined

    this.onMessage = this.onMessage.bind(this)
    this.onWant = this.onWant.bind(this)
  }

  async start () {
    virtualNetwork.on(this._id, this.onMessage)
    virtualNetwork.on('want', this.onWant)
    this._broadcastHeadInterval = setInterval(() => this.broadcastHead.bind(this), this._broadcastFrequency)
    this.broadcastHead()
  }

  setHead (head) {
    this._head = head
    this.broadcastHead()
  }

  broadcastHead () {
    if (this._head) {
      this.broadcast(this._head)
    }
  }

  broadcast (message) {
    virtualNetwork.broadcast(this._id, JSON.stringify(message))
  }

  onMessage (message) {
    this._onMessage(message)
  }

  _onMessage (message) {
    return this._onRemoteHead(JSON.parse(message))
  }

  get (id) {
    return new Promise((resolve, reject) => {
      virtualNetwork.once(id, (message) => {
        const entry = JSON.parse(message)
        resolve(entry)
      })
      virtualNetwork.emit('want', JSON.stringify(id))
    })
  }

  async onWant (message) {
    const wantId = JSON.parse(message)
    const has = await this._log.has(wantId)
    if (has) {
      const entry = await this._log.get(wantId)
      if (entry) {
        virtualNetwork.broadcast(wantId, JSON.stringify(entry))
      }
    }
  }

  async stop () {
    virtualNetwork.removeListener(this._id, this.onMessage)
    virtualNetwork.on('want', this.onWant)
    clearInterval(this._broadcastHeadInterval)
  }
}

module.exports = Network
