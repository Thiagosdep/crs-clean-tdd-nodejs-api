const AuthUseCase = require('./auth-usecase')
const { MissingParamError } = require('../../utils/errors')

const makeSut = () => {
  const loadUserByEmailRepository = makeLoadUserByEmailRepository()
  const encrypterSpy = makeEncrypter()
  const tokenGeneratorSpy = makeTokenGenerator()
  const updateAccessTokenRepositorySpy = makeUpdateAccessTokenRepository()

  const sut = new AuthUseCase({
    loadUserByEmailRepository: loadUserByEmailRepository,
    encrypter: encrypterSpy,
    tokenGenerator: tokenGeneratorSpy,
    updateAccessTokenRepository: updateAccessTokenRepositorySpy
  })
  return {
    sut,
    loadUserByEmailRepository,
    encrypterSpy,
    tokenGeneratorSpy,
    updateAccessTokenRepositorySpy
  }
}

const makeLoadUserByEmailRepository = () => {
  class LoadUserByEmailRepositorySpy {
    async load (email) {
      this.email = email
      return this.user
    }
  }

  const loadUserByEmailRepository = new LoadUserByEmailRepositorySpy()
  loadUserByEmailRepository.user = {
    id: 'any_id',
    password: 'hashed_password'
  }
  return loadUserByEmailRepository
}

const makeLoadUserByEmailRepositoryWithError = () => {
  class LoadUserByEmailRepositorySpy {
    async load () {
      throw new Error()
    }
  }
  return new LoadUserByEmailRepositorySpy()
}

const makeEncrypter = () => {
  class EncrypterSpy {
    async compare (password, hashedPassword) {
      this.password = password
      this.hashedPassword = hashedPassword
      return this.isValid
    }
  }

  const encrypterSpy = new EncrypterSpy()
  encrypterSpy.isValid = true
  return encrypterSpy
}

const makeEncrypterWithError = () => {
  class EncrypterSpy {
    async compare () {
      throw new Error()
    }
  }

  return new EncrypterSpy()
}

const makeTokenGenerator = () => {
  class TokenGeneratorSpy {
    async generate (userId) {
      this.userId = userId
      return this.accessToken
    }
  }

  const tokenGeneratorSpy = new TokenGeneratorSpy()
  tokenGeneratorSpy.accessToken = 'any_token'
  return tokenGeneratorSpy
}

const makeTokenGeneratorWithError = () => {
  class TokenGeneratorSpy {
    async generate () {
      throw new Error()
    }
  }

  return new TokenGeneratorSpy()
}

const makeUpdateAccessTokenRepository = () => {
  class UpdateAccessTokenRepository {
    update (userId, accessToken) {
      this.userId = userId
      this.accessToken = accessToken
    }
  }
  return new UpdateAccessTokenRepository()
}

const makeUpdateAccessTokenRepositoryWithError = () => {
  class UpdateAccessTokenRepository {
    update () {
      throw new Error()
    }
  }

  return new UpdateAccessTokenRepository()
}

describe('Auth UseCase', () => {
  test('Should throw if no email is provided', () => {
    const { sut } = makeSut()
    const promise = sut.auth()
    expect(promise).rejects.toThrow(new MissingParamError('email'))
  })

  test('Should throw if no password is provided', () => {
    const { sut } = makeSut()
    const promise = sut.auth('any_email@mail.com')
    expect(promise).rejects.toThrow(new MissingParamError('password'))
  })

  test('Should call LoadUserByEmailRepository with correct email', async () => {
    const { sut, loadUserByEmailRepository } = makeSut()
    await sut.auth('any_email@mail.com', 'any_password')
    expect(loadUserByEmailRepository.email).toBe('any_email@mail.com')
  })

  test('Should return null if an invalid email is provided', async () => {
    const { sut, loadUserByEmailRepository } = makeSut()
    loadUserByEmailRepository.user = null
    const accessToken = await sut.auth('invalid_email@mail.com', 'any_password')
    expect(accessToken).toBeNull()
  })

  test('Should return null if an invalid password is provided', async () => {
    const { sut, encrypterSpy } = makeSut()
    encrypterSpy.isValid = false
    const accessToken = await sut.auth('valid_email@mail.com', 'invalid_password')
    expect(accessToken).toBe(null)
  })

  test('Should call Encrypter with correct values', async () => {
    const { sut, loadUserByEmailRepository, encrypterSpy } = makeSut()
    await sut.auth('valid_email@mail.com', 'any_password')
    expect(encrypterSpy.password).toBe('any_password')
    expect(encrypterSpy.hashedPassword).toBe(loadUserByEmailRepository.user.password)
  })

  test('Should call TokenGenerator with correct userId', async () => {
    const { sut, loadUserByEmailRepository, tokenGeneratorSpy } = makeSut()
    await sut.auth('valid_email@mail.com', 'valid_password')
    expect(tokenGeneratorSpy.userId).toBe(loadUserByEmailRepository.user.id)
  })

  test('Should return an accessToken with correct credentials are provided', async () => {
    const { sut, tokenGeneratorSpy } = makeSut()
    const accessToken = await sut.auth('valid_email@mail.com', 'valid_password')
    expect(accessToken).toBe(tokenGeneratorSpy.accessToken)
    expect(accessToken).toBeTruthy()
  })

  test('Should call UpdateAccessTokenRepository with correct values', async () => {
    const { sut, loadUserByEmailRepository, tokenGeneratorSpy, updateAccessTokenRepositorySpy } = makeSut()
    await sut.auth('valid_email@mail.com', 'valid_password')
    expect(updateAccessTokenRepositorySpy.userId).toBe(loadUserByEmailRepository.user.id)
    expect(updateAccessTokenRepositorySpy.accessToken).toBe(tokenGeneratorSpy.accessToken)
  })

  test('Should throw if invalid dependencies are provided', () => {
    const invalid = {}
    const loadUserByEmailRepository = makeLoadUserByEmailRepository()
    const tokenGenerator = makeTokenGenerator()
    const suts = [].concat(
      new AuthUseCase({}),
      new AuthUseCase({
        loadUserByEmailRepository: null
      }),
      new AuthUseCase({
        loadUserByEmailRepository: invalid
      }),
      new AuthUseCase({
        loadUserByEmailRepository,
        encrypter: null
      }),
      new AuthUseCase({
        loadUserByEmailRepository,
        encrypter: invalid
      }),
      new AuthUseCase({
        loadUserByEmailRepository,
        encrypter: makeEncrypter(),
        tokenGenerator: null
      }),
      new AuthUseCase({
        loadUserByEmailRepository,
        encrypter: makeEncrypter(),
        tokenGenerator: invalid
      }),
      new AuthUseCase({
        loadUserByEmailRepository,
        encrypter: makeEncrypter(),
        tokenGenerator
      }),
      new AuthUseCase({
        loadUserByEmailRepository,
        encrypter: makeEncrypter(),
        tokenGenerator,
        updateAccessTokenRepository: invalid
      })
    )
    for (const sut of suts) {
      const promise = sut.auth('any_email@mail.com', 'any_password')
      expect(promise).rejects.toThrow()
    }
  })

  test('Should throws if dependency throws', () => {
    const loadUserByEmailRepository = makeLoadUserByEmailRepository()
    const suts = [].concat(
      new AuthUseCase({
        loadUserByEmailRepository: makeLoadUserByEmailRepositoryWithError()
      }),
      new AuthUseCase({
        loadUserByEmailRepository,
        encrypter: makeEncrypterWithError()
      }),
      new AuthUseCase({
        loadUserByEmailRepository,
        encrypter: makeEncrypter(),
        tokenGenerator: makeTokenGeneratorWithError()
      }),
      new AuthUseCase({
        loadUserByEmailRepository,
        encrypter: makeEncrypter(),
        tokenGenerator: makeTokenGenerator(),
        updateAccessTokenRepository: makeUpdateAccessTokenRepositoryWithError()
      })
    )
    for (const sut of suts) {
      const promise = sut.auth('any_email@mail.com', 'any_password')
      expect(promise).rejects.toThrow()
    }
  })
})
