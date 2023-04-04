export const context = {
  payload: {
    issue: {
      body: 'The quick brown fox jumps over the lazy dog.',
      number: 42
    }
  },
  repo: {
    owner: 'whoami',
    repo: 'hello-world'
  }
}

const mockApi = {
  rest: {
    issues: {
      addLabels: jest.fn(),
      removeLabel: jest.fn()
    },
    repos: {
      getContent: jest.fn()
    }
  },
  graphql: jest.fn()
}

export const getOctokit = jest.fn().mockImplementation(() => mockApi)
