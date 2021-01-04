const MongoHelper = require('../infra/helpers/mongo-helper')
const env = require('./config/env')

const port = 4444
MongoHelper.connect(env.mongoUrl)
  .then(() => {
    const app = require('./config/app')
    app.listen(port, () => console.log(`Serving running at http://localhost:${port}`))
  })
  .catch(console.error)
