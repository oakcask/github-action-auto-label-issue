import { describe, expect, it, beforeEach } from 'vitest'
import { parseContext } from '../src/action'

describe('parseContext', () => {
  beforeEach(() => {
    process.env.GITHUB_REPOSITORY = 'foo/bar'
    process.env.GITHUB_EVENT_PATH = '__tests__/fixtures/payload.json'
  })

  it('takes owner/repo from env', () => {
    const ctx = parseContext()
    expect(ctx?.owner).toEqual('foo')
    expect(ctx?.repo).toEqual('bar')
  })

  it('takes owner/repo from payload instead if the env is empty', () => {
    delete process.env.GITHUB_REPOSITORY
    const ctx = parseContext()
    expect(ctx?.owner).toEqual('owner-in-payload')
    expect(ctx?.repo).toEqual('repo-in-payload')
  })

  it('takes issue number and body from payload', () => {
    const ctx = parseContext()!
    expect('issue' in ctx && ctx.issue.id).toEqual('issueid')
    expect('issue' in ctx && ctx.issue.number).toEqual(42)
    expect('issue' in ctx && ctx.issue.body).toEqual('issue body')
  })

  describe('when the payload withoout a issue', () => {
    beforeEach(() => {
      process.env.GITHUB_EVENT_PATH = '__tests__/fixtures/payload.no-issue.json'
    })

    it('is undefined', () => {
      const ctx = parseContext()
      expect(ctx).toBeUndefined()
    })
  })

  describe('when the payload includes pull_request', () => {
    beforeEach(() => {
      process.env.GITHUB_EVENT_PATH = '__tests__/fixtures/payload.pull_request.json'
    })

    it('takes pull request number and body from payload', () => {
      const ctx = parseContext()!
      expect('pullRequest' in ctx && ctx.pullRequest.id).toEqual('prid')
      expect('pullRequest' in ctx && ctx.pullRequest.number).toEqual(4242)
      expect('pullRequest' in ctx && ctx.pullRequest.body).toEqual('pr body')
    })
  })
})
