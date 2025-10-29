import { describe, expect, it, beforeEach } from 'vitest';
import { parseParameters, parseRulebook } from '../src/action';
import { loadLegacyRule } from '../src/rulebook';
import { getConfiguration } from '../src/config';

describe('parseParameters', () => {
  beforeEach(() => {
    process.env.GITHUB_REPOSITORY = 'foo/bar';
    process.env.GITHUB_EVENT_PATH = '__tests__/fixtures/payload.json';
  });

  it('takes owner/repo from env', async () => {
    const params = await parseParameters();
    expect(params?.owner).toEqual('foo');
    expect(params?.repo).toEqual('bar');
  });

  it('takes owner/repo from payload instead if the env is empty', async () => {
    delete process.env.GITHUB_REPOSITORY;
    const params = await parseParameters();
    expect(params?.owner).toEqual('owner-in-payload');
    expect(params?.repo).toEqual('repo-in-payload');
  });

  it('takes issue number and body from payload', async () => {
    const params = (await parseParameters())!;
    expect('issue' in params && params.issue.id).toEqual('issueid');
    expect('issue' in params && params.issue.number).toEqual(42);
    expect('issue' in params && params.issue.body).toEqual('issue body');
  });

  describe('when the payload withoout a issue', async () => {
    beforeEach(() => {
      process.env.GITHUB_EVENT_PATH =
        '__tests__/fixtures/payload.no-issue.json';
    });

    it('is undefined', async () => {
      const params = await parseParameters();
      expect(params).toBeUndefined();
    });
  });

  describe('when the payload includes pull_request', () => {
    beforeEach(() => {
      process.env.GITHUB_EVENT_PATH =
        '__tests__/fixtures/payload.pull_request.json';
    });

    it('takes pull request number and body from payload', async () => {
      const params = (await parseParameters())!;
      expect('pullRequest' in params && params.pullRequest.id).toEqual('prid');
      expect('pullRequest' in params && params.pullRequest.number).toEqual(
        4242,
      );
      expect('pullRequest' in params && params.pullRequest.body).toEqual(
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
      await expect(parseRulebook()).resolves.toMatchObject([
        { id: 'inline-rulebook' },
      ]);
    });
  });

  describe('when rulebook-path is given', () => {
    beforeEach(() => {
      delete process.env.INPUT_RULEBOOK;
    });
    it('loads rulebook', async () => {
      await expect(parseRulebook()).resolves.toMatchObject([
        { id: 'detect-caribbean-pirate-in-issue' },
        { id: 'reverse-detect-caribbean-pirate-in-issue' },
      ]);
    });
  });

  describe('when configuration-path is given', () => {
    beforeEach(() => {
      delete process.env.INPUT_RULEBOOK;
      delete process.env['INPUT_RULEBOOK-PATH'];
    });
    it('loads rulebook', async () => {
      await expect(parseRulebook()).resolves.toStrictEqual(
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
      await expect(parseRulebook()).rejects.toThrow();
    });
  });
});
