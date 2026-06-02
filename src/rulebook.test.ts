import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import type { Context } from './context.js';
import type { Expression } from './ghimex-types.js';
import { executeRulebook, loadLegacyRule, loadRulebook } from './rulebook.js';
import type { Rule } from './rulebook-types.js';

describe('loadRulebook', () => {
  it('loads examples/rulebook.yaml', async () => {
    const rulebook = await loadRulebook({ path: 'examples/rulebook.yaml' });
    assert.notEqual(rulebook, undefined);
    assert.deepEqual(rulebook, [
      {
        id: 'detect-caribbean-pirate-in-issue',
        when: [
          { label: 'label-test' },
          {
            all: [
              { label: 'label-test:rum' },
              {
                any: ['[Aa]hoy', '[Mm]atey', '([AR]a*|Ya+)rrr+!'],
              },
            ],
          },
        ],
        then: [{ addLabel: 'label-test:pirate:caribbean' }],
      },
      {
        id: 'reverse-detect-caribbean-pirate-in-issue',
        when: [
          { label: 'label-test' },
          {
            not: [
              { label: 'label-test:rum' },
              {
                any: ['[Aa]hoy', '[Mm]atey', '([AR]a*|Ya+)rrr+!'],
              },
            ],
          },
        ],
        then: [{ removeLabel: 'label-test:pirate:caribbean' }],
      },
    ]);
  });
});

describe('loadLegacyRule', () => {
  it('loads Rulebook from legacy Configuration', () => {
    const expression: Expression = {
      all: [
        { label: 'rum' },
        {
          any: ['[Aa]hoy', '[Mm]atey', '([AR]a*|Ya+)rrr+!'],
        },
      ],
    };
    const got = loadLegacyRule({
      'pirate:caribbean': {
        removeOnMissing: true,
        expression,
      },
    });
    assert.deepEqual(got, [
      {
        when: expression,
        then: [{ addLabel: 'pirate:caribbean' }],
      },
      {
        when: { not: expression },
        then: [{ removeLabel: 'pirate:caribbean' }],
      },
    ]);
  });
});

describe('executeRulebook', () => {
  it('invokes onAddLabel when condition matches', async () => {
    const onAddLabel = mock.fn();
    const ctx: Context = {
      body: () => 'a',
      labels: () => [],
      onAddLabel,
      onRemoveLabel: () => {},
      finish: () => Promise.resolve(),
    };
    const rule: Rule = {
      when: 'a',
      then: [{ addLabel: 'added' }],
    };
    await executeRulebook(ctx, rule);
    assert.deepEqual(
      onAddLabel.mock.calls.map((call) => call.arguments),
      [['added']],
    );
  });

  it('invokes onRemoveLabel when condition matches', async () => {
    const onRemoveLabel = mock.fn();
    const ctx: Context = {
      body: () => 'b',
      labels: () => [],
      onAddLabel: () => {},
      onRemoveLabel,
      finish: () => Promise.resolve(),
    };
    const rule: Rule = {
      when: { not: 'a' },
      then: [{ removeLabel: 'added' }],
    };
    await executeRulebook(ctx, rule);
    assert.deepEqual(
      onRemoveLabel.mock.calls.map((call) => call.arguments),
      [['added']],
    );
  });
});
