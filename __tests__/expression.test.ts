import { isMatch, Expression } from '../src/expression'

describe('isMatch', () => {
  const testCases: Array<[{ body: string }, Expression, boolean]> = [
    [{ body: 'alice' }, 'a', true],
    [{ body: 'alice' }, { pattern: 'a' }, true],
    [{ body: 'bob' }, 'a', false],
    [{ body: 'bob' }, { pattern: 'a' }, false],
    [{ body: 'alice' }, ['a', 'l', 'i', 'c', 'e'], true],
    [{ body: 'alice' }, ['a', 'l', 'i', 'k', 'e'], false],
    [{ body: 'alice' }, { any: ['a', 'b'] }, true],
    [{ body: '' }, {}, false]
  ]

  it.each(testCases)('for given document %j and expression %j, returns %p', async (doc, exp, outcome) => {
    expect(isMatch({ body: doc.body }, exp)).toBe(outcome)
  })
})
