const LoadUserByEmailRepository = require('./load-user-by-email-repository')
const { MissingParamError } = require('../../utils/errors')
const MongoHelper = require('../helpers/mongo-helper')
let userModel

const makeSut = () => {
  return new LoadUserByEmailRepository()
}

describe('LoadUserByEmailRepository', () => {
  beforeAll(async () => {
    await MongoHelper.connect(process.env.MONGO_URL)
    userModel = await MongoHelper.getCollection('users')
  })

  beforeEach(async () => {
    await userModel.deleteMany()
  })

  afterAll(async () => {
    await MongoHelper.disconnect()
  })

  test('Should return null if no user is found', async () => {
    const sut = makeSut()
    const user = await sut.load('invalid_email@mail.com')
    expect(user).toBeNull()
  })

  test('Should return an user if user is found', async () => {
    const sut = makeSut()
    const fakeUser = await userModel.insertOne({
      email: 'valid_email@mail.com',
      name: 'any_name',
      age: 22,
      state: 'any_state',
      password: 'any_hashedpassword'
    })
    const user = await sut.load('valid_email@mail.com')
    expect(user).toEqual({
      _id: fakeUser.ops[0]._id,
      password: fakeUser.ops[0].password
    })
  })

  test('Should return throw if no email is provided', () => {
    const sut = makeSut()
    const promise = sut.load()
    expect(promise).rejects.toThrow(new MissingParamError('email'))
  })
})
