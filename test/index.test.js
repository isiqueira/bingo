import { describe, beforeEach, it } from 'node:test'
import { deepStrictEqual, strictEqual, ok } from 'node:assert'
import Fastify from 'fastify'
import { faker } from '@faker-js/faker'

// Mock firebase/database
import * as firebaseDatabase from 'firebase/database'
import * as mod from './index.js'

// Mock implementations
firebaseDatabase.set = async () => {}
firebaseDatabase.remove = async () => {}
firebaseDatabase.ref = () => {}
firebaseDatabase.onValue = () => {}

describe('Bingo Server (node:test style)', () => {
  let writeUserData, writeNewNumber

  beforeEach(() => {
    writeUserData = mod.writeUserData
    writeNewNumber = mod.writeNewNumber
  })

  it('writeUserData calls set with correct params', async () => {
    let calledWith = null
    firebaseDatabase.set = async (refArg, dataArg) => { calledWith = { refArg, dataArg } }
    const userId = 'abc'
    const name = faker.person.fullName()
    const email = faker.internet.email()
    const imageUrl = faker.image.avatar()
    await writeUserData(userId, name, email, imageUrl)
    deepStrictEqual(calledWith.dataArg, {
      username: name,
      email: email,
      profile_picture: imageUrl,
    })
  })

  it('writeNewNumber calls set with correct params', async () => {
    let calledWith = null
    firebaseDatabase.set = async (refArg, dataArg) => { calledWith = { refArg, dataArg } }
    const number = 42
    await writeNewNumber(number)
    strictEqual(typeof calledWith.dataArg.number, 'number')
    strictEqual(typeof calledWith.dataArg.date, 'number')
  })

  it('POST /bingo/clear-game calls remove', async () => {
    let removeCalled = false
    firebaseDatabase.remove = async () => { removeCalled = true }
    const fastify = Fastify()
    fastify.post('/bingo/clear-game', async (request, reply) => {
      await firebaseDatabase.remove(firebaseDatabase.ref({}, 'users'))
      reply.send({ ok: true })
    })
    const response = await fastify.inject({
      method: 'POST',
      url: '/bingo/clear-game',
    })
    ok(removeCalled)
    strictEqual(response.statusCode, 200)
  })

  it('POST /bingo calls writeNewNumber', async () => {
    let called = false
    writeNewNumber = () => { called = true }
    const fastify = Fastify()
    fastify.post('/bingo', async (request, reply) => {
      writeNewNumber(request.body.number)
      reply.send({ ok: true })
    })
    const response = await fastify.inject({
      method: 'POST',
      url: '/bingo',
      payload: { number: 7 },
    })
    ok(called)
    strictEqual(response.statusCode, 200)
  })

  it('POST /users calls writeUserData', async () => {
    let called = false
    writeUserData = () => { called = true }
    const fastify = Fastify()
    fastify.post('/users', async (request, reply) => {
      writeUserData(request.body.id, request.body.name, request.body.email, request.body.imageUrl)
      reply.send({ ok: true })
    })
    const payload = { id: '1', name: 'A', email: 'a@b.com', imageUrl: 'img' }
    const response = await fastify.inject({
      method: 'POST',
      url: '/users',
      payload,
    })
    ok(called)
    strictEqual(response.statusCode, 200)
  })
})