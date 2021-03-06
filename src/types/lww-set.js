'use strict'

module.exports = {
  first: () => [new Map(), new Map()],
  reduce: (message, previous) => previous.map((previousMap, i) => {
    const map = new Map([...previousMap])
    if (message[i]) {
      map.set(message[i][1], message[i][0])
    }
    return map
  }),

  valueOf: (state) => {
    const adds = Array.from(state[0].entries())
    const removes = state[1]
    return new Set(adds
      .filter((add) => {
        const key = add[0]
        const addTs = add[1]
        return !removes.has(key) || removes.get(key) < addTs
      })
      .map((add) => add[0]))
  },

  mutators: {
    add: (elem) => [[timestamp(), elem], null],
    remove: (elem) => [null, [timestamp(), elem]]
  }
}

function timestamp () {
  return Date.now()
}
