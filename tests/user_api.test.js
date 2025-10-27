
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

describe('users api', () => {
  test('create user', async () => {
    const newUser = { username: 'testuser', password: 'sekret' }
    await api.post('/api/users').send(newUser).expect(201).expect('Content-Type', /application\/json/)
  })
})
