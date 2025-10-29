import fs from 'node:fs/promises';
import util from 'node:util';
import * as core from '@actions/core';
import { Octokit } from '@octokit/action';
import type { WebhookEvent } from '@octokit/webhooks-types';
import { getConfiguration } from './config.js';
import { getContext, type Parameters } from './context.js';
import {
  executeRulebook,
  loadLegacyRule,
  loadRulebook,
  type Rulebook,
} from './rulebook.js';

export async function parseParameters(): Promise<Parameters | undefined> {
  const payload = JSON.parse(
    await fs.readFile(process.env.GITHUB_EVENT_PATH!, 'utf8'),
  ) as WebhookEvent;
  const repo = parseRepo(payload);
  const issue = parseIssue(payload);
  if (issue) {
    return {
      ...repo,
      issue,
    };
  }
  const pullRequest = parsePullRequest(payload);
  if (pullRequest) {
    return {
      ...repo,
      pullRequest,
    };
  }

  return undefined;
}

function parseRepo(payload: WebhookEvent): { owner: string; repo: string } {
  if (process.env.GITHUB_REPOSITORY) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
    return { owner, repo };
  }
  if ('repository' in payload && payload.repository) {
    return {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
    };
  }

  throw new Error('cannot recognize the repository');
}

function parseIssue(
  payload: WebhookEvent,
): { id: string; number: number; body: string } | undefined {
  if ('issue' in payload && payload.issue) {
    return {
      id: payload.issue.node_id,
      number: payload.issue.number,
      body: payload.issue.body || '',
    };
  }
  return undefined;
}

function parsePullRequest(
  payload: WebhookEvent,
): { id: string; number: number; body: string } | undefined {
  if ('pull_request' in payload && payload.pull_request) {
    return {
      id: payload.pull_request.node_id,
      number: payload.pull_request.number,
      body: payload.pull_request.body || '',
    };
  }
}

async function tryParseRulebookFromPath(): Promise<Rulebook | undefined> {
  const rulebookPath = core.getInput('rulebook-path');
  if (rulebookPath) {
    core.debug(util.format('loading rulebook from %o', rulebookPath));
    return await loadRulebook({ path: rulebookPath });
  }
}

async function tryParseRulebookFromString(): Promise<Rulebook | undefined> {
  const rulebook = core.getInput('rulebook');
  if (rulebook) {
    core.debug('loading inline rulebook');
    return await loadRulebook(rulebook);
  }
}

async function tryParseRulebookFromLegacyConfiguration(): Promise<
  Rulebook | undefined
> {
  const configPath = core.getInput('configuration-path');
  if (configPath) {
    core.debug(
      util.format('loading rulebook from legacy configuration: %o', configPath),
    );
    return loadLegacyRule(await getConfiguration(configPath));
  }
}

export async function parseRulebook(): Promise<Rulebook> {
  const rulebook =
    (await tryParseRulebookFromString()) ||
    (await tryParseRulebookFromPath()) ||
    (await tryParseRulebookFromLegacyConfiguration());
  if (typeof rulebook !== 'undefined') {
    return rulebook;
  }

  throw new Error('no rulebook or legacy configuration specified');
}

export async function main() {
  const octokit = new Octokit();
  const params = await parseParameters();

  if (!params) {
    core.info('cannot find a issue or pull request to update.');
    return;
  }

  const rulebook = await parseRulebook();
  const context = await getContext(octokit, params);

  await executeRulebook(context, rulebook);
}
