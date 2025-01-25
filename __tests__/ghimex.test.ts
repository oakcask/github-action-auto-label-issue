import { describe, it, expect } from 'vitest'
import { isMatch, Expression } from '../src/ghimex'

class TestIssue {
  readonly _body: string
  readonly _labels: string[]

  constructor (given: { body: string, labels?: string[]}) {
    this._body = given.body
    this._labels = given.labels || []
  }

  body () {
    return this._body
  }

  labels () {
    return this._labels
  }
}

describe('isMatch', () => {
  const testCases: Array<[{ body: string, labels?: string[] }, Expression, boolean]> = [
    [{ body: 'alice' }, 'a', true],
    [{ body: 'alice' }, { pattern: 'a' }, true],
    [{ body: 'bob' }, 'a', false],
    [{ body: 'bob' }, { pattern: 'a' }, false],
    [{ body: 'alice' }, ['a', 'l', 'i', 'c', 'e'], true],
    [{ body: 'alice' }, ['a', 'l', 'i', 'k', 'e'], false],
    [{ body: 'alice' }, { any: ['a', 'b'] }, true],
    [{ body: '' }, {}, false],

    [{ body: 'alice', labels: ['foo', 'bar'] }, { any: [{ label: 'foo' }, { label: 'bar' }] }, true],
    [{ body: 'alice', labels: ['foo'] }, { any: [{ label: 'foo' }, { label: 'bar' }] }, true],
    [{ body: 'alice', labels: ['bar'] }, { any: [{ label: 'foo' }, { label: 'bar' }] }, true],

    [{ body: 'alice', labels: ['foo', 'bar'] }, { all: [{ label: 'foo' }, { label: 'bar' }] }, true],
    [{ body: 'alice', labels: ['foo'] }, { all: [{ label: 'foo' }, { label: 'bar' }] }, false],
    [{ body: 'alice', labels: ['bar'] }, { all: [{ label: 'foo' }, { label: 'bar' }] }, false],
    [{ body: 'alice', labels: ['foo', 'bar'] }, [{ label: 'foo' }, { label: 'bar' }], true],
    [{ body: 'alice', labels: ['foo'] }, [{ label: 'foo' }, { label: 'bar' }], false],
    [{ body: 'alice', labels: ['bar'] }, [{ label: 'foo' }, { label: 'bar' }], false],

    [{ body: 'alice', labels: ['foo'] }, ['alice', { label: 'foo' }], true],
    [{ body: 'alice', labels: ['foo'] }, { all: ['alice', { label: 'foo' }] }, true],
    [{ body: 'bob', labels: ['bar'] }, { any: ['alice', { label: 'foo' }] }, false],

    [{ body: '', labels: ['foo:a'] }, { matchLabel: 'foo:a.*' }, true],
    [{ body: '', labels: ['foo:ab'] }, { matchLabel: 'foo:a.*' }, true],
    [{ body: '', labels: ['foo:bb'] }, { matchLabel: 'foo:a.*' }, false],

    [{ body: '', labels: ['foo'] }, { not: { matchLabel: 'foo' } }, false],
    [{ body: '', labels: ['foo'] }, { not: { matchLabel: 'bar' } }, true]
  ]

  it.each(testCases)('for given document %j and expression %j, returns %p', async (doc, exp, outcome) => {
    expect(isMatch(new TestIssue(doc), exp)).toBe(outcome)
  })
})
