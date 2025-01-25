import { describe, expect, it, beforeEach } from 'vitest'
import { parseContext } from '../src/action'

describe('parseContext', () => {
  beforeEach(() => {
    process.env.GITHUB_REPOSITORY = 'foo/bar'
    process.env.GITHUB_EVENT_PATH = '__tests__/fixtures/payload.json'
    process.env.GITHUB_REF = 'refname'
  })

  it('takes owner/repo from env', () => {
    const ctx = parseContext()
    expect(ctx?.repo.owner).toEqual('foo')
    expect(ctx?.repo.repo).toEqual('bar')
  })

  it('takes owner/repo from payload instead if the env is empty', () => {
    delete process.env.GITHUB_REPOSITORY
    const ctx = parseContext()
    expect(ctx?.repo.owner).toEqual('owner-in-payload')
    expect(ctx?.repo.repo).toEqual('repo-in-payload')
  })

  it('takes issue number and body from payload', () => {
    const ctx = parseContext()
    expect(ctx?.issue.number).toEqual(42)
    expect(ctx?.issue.body).toEqual('issue body')
  })

  it('takes ref from payload', () => {
    const ctx = parseContext()
    expect(ctx?.ref).toEqual('refname')
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
})
