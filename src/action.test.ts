import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { parseParameters, parseRulebook } from './action.js';
import { getConfiguration } from './config.js';
import { loadLegacyRule } from './rulebook.js';

describe('parseParameters', () => {
  beforeEach(() => {
    process.env.GITHUB_REPOSITORY = 'foo/bar';
    process.env.GITHUB_EVENT_PATH = 'src/fixtures/payload.json';
  });

  it('takes owner/repo from env', async () => {
    const params = await parseParameters();
    assert.equal(params?.owner, 'foo');
    assert.equal(params?.repo, 'bar');
  });

  it('takes owner/repo from payload instead if the env is empty', async () => {
    delete process.env.GITHUB_REPOSITORY;
    const params = await parseParameters();
    assert.equal(params?.owner, 'owner-in-payload');
    assert.equal(params?.repo, 'repo-in-payload');
  });

  it('takes issue number and body from payload', async () => {
    const params = (await parseParameters())!;
    assert.equal('issue' in params && params.issue.id, 'issueid');
    assert.equal('issue' in params && params.issue.number, 42);
    assert.equal('issue' in params && params.issue.body, 'issue body');
  });

  describe('when the payload without an issue', () => {
    beforeEach(() => {
      process.env.GITHUB_EVENT_PATH = 'src/fixtures/payload.no-issue.json';
    });

    it('is undefined', async () => {
      const params = await parseParameters();
      assert.equal(params, undefined);
    });
  });

  describe('when the payload includes pull_request', () => {
    beforeEach(() => {
      process.env.GITHUB_EVENT_PATH = 'src/fixtures/payload.pull_request.json';
    });

    it('takes pull request number and body from payload', async () => {
      const params = (await parseParameters())!;
      assert.equal('pullRequest' in params && params.pullRequest.id, 'prid');
      assert.equal('pullRequest' in params && params.pullRequest.number, 4242);
      assert.equal(
        'pullRequest' in params && params.pullRequest.body,
        'pr body',
      );
    });
  });
});

describe('parseRulebook', () => {
  beforeEach(() => {
    process.env.INPUT_RULEBOOK = `
- id: inline-rulebook
  when:
    label: foo
  then:
    - removeLabel: foo
`;
    process.env['INPUT_RULEBOOK-PATH'] = 'examples/rulebook.yaml';
    process.env['INPUT_CONFIGURATION-PATH'] = 'examples/config.yaml';
  });

  describe('when rulebook is given', () => {
    it('loads rulebook', async () => {
      assert.deepEqual(await parseRulebook(), [
        {
          id: 'inline-rulebook',
          when: { label: 'foo' },
          then: [{ removeLabel: 'foo' }],
        },
      ]);
    });
  });

  describe('when rulebook-path is given', () => {
    beforeEach(() => {
      delete process.env.INPUT_RULEBOOK;
    });

    it('loads rulebook', async () => {
      const rulebook = await parseRulebook();
      assert.ok(Array.isArray(rulebook));
      assert.deepEqual(
        rulebook.map((rule) => rule.id),
        [
          'detect-caribbean-pirate-in-issue',
          'reverse-detect-caribbean-pirate-in-issue',
        ],
      );
    });
  });

  describe('when configuration-path is given', () => {
    beforeEach(() => {
      delete process.env.INPUT_RULEBOOK;
      delete process.env['INPUT_RULEBOOK-PATH'];
    });

    it('loads rulebook', async () => {
      assert.deepEqual(
        await parseRulebook(),
        loadLegacyRule(await getConfiguration('examples/config.yaml')),
      );
    });
  });

  describe('when given no inputs', () => {
    beforeEach(() => {
      delete process.env.INPUT_RULEBOOK;
      delete process.env['INPUT_RULEBOOK-PATH'];
      delete process.env['INPUT_CONFIGURATION-PATH'];
    });

    it('fails', async () => {
      await assert.rejects(parseRulebook());
    });
  });
});
