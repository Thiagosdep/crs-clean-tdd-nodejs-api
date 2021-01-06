module.exports = class ExpressRouterAdapter {
  static adapt (router) {
    return async (req, res) => {
      const httpRequest = {
        body: req.body
      }
      const httpReponse = await router.route(httpRequest)
      res.status(httpReponse.statusCode).json(httpReponse.body)
    }
  }
}
