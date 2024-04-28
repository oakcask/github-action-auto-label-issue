import * as github from '@actions/github'
import * as core from '@actions/core'
import fs from 'fs'
import { main } from '../src/action'

const gh = github.getOctokit('_')
const addLabels = jest.spyOn(gh.rest.issues, 'addLabels')
const removeLabel = jest.spyOn(gh.rest.issues, 'removeLabel')
const getContent = jest.spyOn(gh.rest.repos, 'getContent')
jest.spyOn(gh, 'graphql').mockImplementationOnce(async () => ({
  repository: {
    issue: {
      labels: {
        pageInfo: {
          endCursor: null,
          hasNextPage: false
        },
        nodes: [{
          id: '',
          name: 'foo',
          resourcePath: ''
        }]
      }
    }
  }
}))

jest.spyOn(core, 'getInput').mockImplementation((key) => {
  return (
    {
      'repo-token': 'repotoken',
      'configuration-path': '.github/auto-label-issue.yml'
    }[key] ?? ''
  )
})

const configuration = fs.readFileSync('__tests__/fixtures/example.yml')

describe('main', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getContent.mockResolvedValue(<any>{
      data: { content: configuration, encoding: 'utf8' }
    })
  })

  it('runs', async () => {
    await main()

    expect(addLabels).toHaveBeenCalledWith({
      issue_number: 42,
      labels: ['fox', 'regex'],
      owner: 'whoami',
      repo: 'hello-world'
    })
    expect(removeLabel).toHaveBeenCalledWith({
      issue_number: 42,
      name: 'cow',
      owner: 'whoami',
      repo: 'hello-world'
    })
    expect(removeLabel).not.toHaveBeenCalledWith({
      issue_number: 42,
      name: 'cat',
      owner: 'whoami',
      repo: 'hello-world'
    })
  })
})
