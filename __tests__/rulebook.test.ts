import { describe, it, expect, vi } from 'vitest';
import type { Rule } from '../src/rulebook-types.js';
import { executeRulebook, loadLegacyRule, loadRulebook } from '../src/rulebook';
import type { Expression } from '../src/ghimex-types';
import type { Context } from '../src/context';

describe('loadRulebook', () => {
  it('loads examples/rulebook.yaml', async () => {
    const rulebook = await loadRulebook({ path: 'examples/rulebook.yaml' });
    expect(rulebook).not.toBeUndefined();
    expect(rulebook).toStrictEqual([
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
    expect(got).toStrictEqual([
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
    const onAddLabel = vi.fn();
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
    expect(onAddLabel).toHaveBeenCalledWith('added');
  });

  it('invokes onRemoveLabel when condition matches', async () => {
    const onRemoveLabel = vi.fn();
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
    expect(onRemoveLabel).toHaveBeenCalledWith('added');
  });
});
