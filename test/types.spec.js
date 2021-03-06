/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const Store = require('./helpers/store')
const Network = require('./helpers/network')
const CRDT = require('../')

describe('types', () => {
  let myCRDT

  before(() => {
    myCRDT = CRDT.defaults({
      store: (id) => new Store(id),
      network: (id, log, onRemoteHead) => new Network(id, log, onRemoteHead, 100)
    })
  })

  describe('g-counter', () => {
    let instances

    before(() => {
      instances = [
        myCRDT.create('g-counter', 'g-counter-test', {
          authenticate: (entry, parents) => 'authentication for 0 ' + JSON.stringify([entry, parents])
        }),
        myCRDT.create('g-counter', 'g-counter-test', {
          authenticate: (entry, parents) => 'authentication for 1 ' + JSON.stringify([entry, parents])
        })
      ]
    })

    before(() => {
      return Promise.all(instances.map((i) => i.network.start()))
    })

    after(() => {
      return Promise.all(instances.map((i) => i.network.stop()))
    })

    it('converges', function (done) {
      this.timeout(3000)

      const changes = [0, 0]
      instances.forEach((instance, i) => instance.on('change', () => { changes[i]++ }))

      instances[0].increment()
      instances[0].increment()
      instances[1].increment()
      instances[0].increment()
      instances[1].increment()
      instances[1].increment()
      instances[1].increment()

      setTimeout(() => {
        expect(instances.map((i) => i.value())).to.deep.equal([7, 7])
        expect(changes).to.deep.equal([7, 7])
        done()
      }, 2000)
    })
  })

  describe('pn-counter', () => {
    let instances

    before(() => {
      instances = [
        myCRDT.create('pn-counter', 'pn-counter-test', {
          authenticate: (entry, parents) => 'authentication for 0 ' + JSON.stringify([entry, parents])
        }),
        myCRDT.create('pn-counter', 'pn-counter-test', {
          authenticate: (entry, parents) => 'authentication for 1 ' + JSON.stringify([entry, parents])
        })
      ]
    })

    before(() => {
      return Promise.all(instances.map((i) => i.network.start()))
    })

    after(() => {
      return Promise.all(instances.map((i) => i.network.stop()))
    })

    it('converges', function (done) {
      this.timeout(3000)

      const changes = [0, 0]
      instances.forEach((instance, i) => instance.on('change', () => { changes[i]++ }))

      instances[0].increment()
      instances[0].increment()
      instances[1].increment()
      instances[0].decrement()
      instances[1].increment()
      instances[1].decrement()
      instances[1].increment()

      setTimeout(() => {
        expect(instances.map((i) => i.value())).to.deep.equal([3, 3])
        expect(changes).to.deep.equal([7, 7])
        done()
      }, 2000)
    })
  })

  describe('g-set', () => {
    let instances

    before(() => {
      instances = [
        myCRDT.create('g-set', 'g-set-test', {
          authenticate: (entry, parents) => 'authentication for 0 ' + JSON.stringify([entry, parents])
        }),
        myCRDT.create('g-set', 'g-set-test', {
          authenticate: (entry, parents) => 'authentication for 1 ' + JSON.stringify([entry, parents])
        })
      ]
    })

    before(() => {
      return Promise.all(instances.map((i) => i.network.start()))
    })

    after(() => {
      return Promise.all(instances.map((i) => i.network.stop()))
    })

    it('converges', function (done) {
      this.timeout(3000)

      const changes = [0, 0]
      instances.forEach((instance, i) => instance.on('change', () => { changes[i]++ }))

      instances[0].add('a')
      instances[0].add('b')
      instances[1].add('c')
      instances[0].add('d')
      instances[1].add('e')
      instances[1].add('f')
      instances[1].add('g')

      setTimeout(() => {
        instances.forEach((i) => {
          expect(Array.from(i.value()).sort()).to.deep.equal(['a', 'b', 'c', 'd', 'e', 'f', 'g'])
        })
        expect(changes).to.deep.equal([7, 7])
        done()
      }, 2000)
    })
  })

  describe('2p-set', () => {
    let instances

    before(() => {
      instances = [
        myCRDT.create('2p-set', '2p-set-test', {
          authenticate: (entry, parents) => 'authentication for 0 ' + JSON.stringify([entry, parents])
        }),
        myCRDT.create('2p-set', '2p-set-test', {
          authenticate: (entry, parents) => 'authentication for 1 ' + JSON.stringify([entry, parents])
        })
      ]
    })

    before(() => {
      return Promise.all(instances.map((i) => i.network.start()))
    })

    after(() => {
      return Promise.all(instances.map((i) => i.network.stop()))
    })

    it('converges', function (done) {
      this.timeout(3000)

      const changes = [0, 0]
      instances.forEach((instance, i) => instance.on('change', () => { changes[i]++ }))

      instances[0].add('a')
      instances[0].add('b')
      instances[1].remove('a')
      instances[0].add('c')
      instances[1].add('d')
      instances[1].remove('b')
      instances[1].remove('g')

      setTimeout(() => {
        instances.forEach((i) => {
          expect(Array.from(i.value()).sort()).to.deep.equal(['c', 'd'])
        })
        expect(changes).to.deep.equal([7, 7])
        done()
      }, 2000)
    })
  })

  describe('lww-set', () => {
    let instances

    before(() => {
      instances = [
        myCRDT.create('lww-set', 'lww-set-test', {
          authenticate: (entry, parents) => 'authentication for 0 ' + JSON.stringify([entry, parents])
        }),
        myCRDT.create('lww-set', 'lww-set-test', {
          authenticate: (entry, parents) => 'authentication for 1 ' + JSON.stringify([entry, parents])
        })
      ]
    })

    before(() => {
      return Promise.all(instances.map((i) => i.network.start()))
    })

    after(() => {
      return Promise.all(instances.map((i) => i.network.stop()))
    })

    it('converges', function (done) {
      this.timeout(3000)

      const changes = [0, 0]
      instances.forEach((instance, i) => instance.on('change', () => { changes[i]++ }))

      instances[0].add('a')
      instances[0].add('b')
      instances[0].add('c')
      instances[0].remove('a')
      instances[1].remove('d')

      setTimeout(() => {
        instances.forEach((i) => {
          expect(Array.from(i.value()).sort()).to.deep.equal(['b', 'c'])
        })

        instances[1].add('d')
        instances[1].add('a')
        instances[1].remove('b')
        instances[1].remove('g')

        setTimeout(() => {
          instances.forEach((i) => {
            expect(Array.from(i.value()).sort()).to.deep.equal(['a', 'c', 'd'])
          })
          expect(changes).to.deep.equal([9, 9])
          done()
        }, 1000)
      }, 1000)
    })
  })

  describe('or-set', () => {
    let instances

    before(() => {
      instances = [
        myCRDT.create('or-set', 'or-set-test', {
          authenticate: (entry, parents) => 'authentication for 0 ' + JSON.stringify([entry, parents])
        }),
        myCRDT.create('or-set', 'or-set-test', {
          authenticate: (entry, parents) => 'authentication for 1 ' + JSON.stringify([entry, parents])
        })
      ]
    })

    before(() => {
      return Promise.all(instances.map((i) => i.network.start()))
    })

    after(() => {
      return Promise.all(instances.map((i) => i.network.stop()))
    })

    it('converges', function (done) {
      this.timeout(3000)

      const changes = [0, 0]
      instances.forEach((instance, i) => instance.on('change', () => { changes[i]++ }))

      instances[0].add('a')
      instances[0].add('b')
      instances[0].add('c')
      instances[0].remove('a')
      instances[1].remove('d')

      setTimeout(() => {
        instances.forEach((i) => {
          expect(i.value().sort()).to.deep.equal(['a', 'b', 'c'])
        })

        instances[1].add('d')
        instances[1].add('a')
        instances[1].remove('b')
        instances[1].remove('g')

        setTimeout(() => {
          instances.forEach((i) => {
            expect(i.value().sort()).to.deep.equal(['a', 'c', 'd'])
          })
          expect(changes).to.deep.equal([6, 6])
          done()
        }, 1000)
      }, 1000)
    })
  })
})

process.on('unhandledRejection', (rej) => {
  console.log(rej)
})
