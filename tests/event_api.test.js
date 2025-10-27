
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

describe('events api', () => {
  test('get events', async () => {
    await api.get('/api/events').expect(200)
  })
})
