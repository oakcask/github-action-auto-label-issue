import { isMatch, Expression } from '../src/expression'

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

    [{ body: 'alice', labels: ['foo', 'bar'] }, { any: [{ label: 'foo' }, { label: 'bar' }]}, true ],
    [{ body: 'alice', labels: ['foo'] }, { any: [{ label: 'foo' }, { label: 'bar' }]}, true ],
    [{ body: 'alice', labels: ['bar'] }, { any: [{ label: 'foo' }, { label: 'bar' }]}, true ],

    [{ body: 'alice', labels: ['foo', 'bar'] }, { all: [{ label: 'foo' }, { label: 'bar' }]}, true ],
    [{ body: 'alice', labels: ['foo'] }, { all: [{ label: 'foo' }, { label: 'bar' }]}, false ],
    [{ body: 'alice', labels: ['bar'] }, { all: [{ label: 'foo' }, { label: 'bar' }]}, false ],
    [{ body: 'alice', labels: ['foo', 'bar'] }, [{ label: 'foo' }, { label: 'bar' }], true ],
    [{ body: 'alice', labels: ['foo'] }, [{ label: 'foo' }, { label: 'bar' }], false ],
    [{ body: 'alice', labels: ['bar'] }, [{ label: 'foo' }, { label: 'bar' }], false ],

    [{ body: 'alice', labels: ['foo'] }, ['alice', { label: 'foo' }], true ],
    [{ body: 'alice', labels: ['foo'] }, { all: ['alice', { label: 'foo' }] }, true ],
    [{ body: 'bob', labels: ['bar'] }, { any: ['alice', { label: 'foo' }] }, false ],
  ]

  it.each(testCases)('for given document %j and expression %j, returns %p', async (doc, exp, outcome) => {
    expect(isMatch({ body: doc.body, labels: doc.labels || [] }, exp)).toBe(outcome)
  })
})
