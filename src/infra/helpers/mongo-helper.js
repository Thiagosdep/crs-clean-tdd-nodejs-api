const { MongoClient } = require('mongodb')

module.exports = {
  async connect (uri) {
    this.uri = uri
    this.connection = await MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    this.db = await this.connection.db()
  },

  async disconnect () {
    await this.connection.close()
    this.client = null
    this.db = null
  },

  async getCollection (name) {
    if (!this.connection || !this.connection.isConnected()) {
      await this.connect(this.uri, this.dbName)
    }
    return this.db.collection(name)
  }
}
