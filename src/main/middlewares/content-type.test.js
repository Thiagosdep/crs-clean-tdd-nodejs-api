const request = require('supertest')
const app = require('../config/app')

describe('Content-type middleware', () => {
  test('Should return json content-type', async () => {
    app.get('/test_content_type', (req, res) => {
      res.send('')
    })

    await request(app)
      .get('/test_content_type')
      .expect('content-type', /json/)
  })
})
