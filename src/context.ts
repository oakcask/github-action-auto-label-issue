import type { Octokit } from '@octokit/action';
import {
  getLabelsOnIssueLike,
  getRepositoryLabels,
  updateLabels,
} from './github.js';
import * as core from '@actions/core';

export type Parameters = {
  owner: string;
  repo: string;
} & (
  | {
      issue: {
        id: string;
        number: number;
        body: string;
      };
    }
  | {
      pullRequest: {
        id: string;
        number: number;
        body: string;
      };
    }
);

export interface Context {
  body(): string;
  labels(): string[];

  onAddLabel(label: string): void;
  onRemoveLabel(label: string): void;
  finish(): Promise<void>;
}

class Issue {
  readonly _octokit: Octokit;
  readonly _params: Parameters;
  readonly _labels: string[];
  _labelsToAdd: string[] = [];
  _labelsToRemove: string[] = [];

  constructor(octokit: Octokit, params: Parameters, labels: string[]) {
    this._octokit = octokit;
    this._params = params;
    this._labels = labels;
  }

  body() {
    if ('issue' in this._params) {
      return this._params.issue.body;
    } else {
      return this._params.pullRequest.body;
    }
  }

  labels() {
    return this._labels;
  }

  onAddLabel(label: string) {
    this._labelsToAdd.push(label);
  }

  onRemoveLabel(label: string) {
    this._labelsToRemove.push(label);
  }

  async finish() {
    await this.updateLabels();
  }

  async updateLabels() {
    const repoLabels = await getRepositoryLabels(this._octokit, this._params);
    const labelsToAdd = this._labelsToAdd
      .map((name) => {
        if (name in repoLabels) {
          return repoLabels[name];
        }
        core.warning(`ignoring missing label: ${name}`);
        return undefined;
      })
      .filter((id) => typeof id === 'string');
    const labelsToRemove = this._labelsToRemove
      .map((name) => {
        if (name in repoLabels) {
          return repoLabels[name];
        }
        core.warning(`ignoring missing label: ${name}`);
        return undefined;
      })
      .filter((id) => typeof id === 'string');

    const labelableId =
      'issue' in this._params
        ? this._params.issue.id
        : this._params.pullRequest.id;
    await updateLabels(this._octokit, {
      labelableId,
      labelsToAdd,
      labelsToRemove,
    });
  }
}

export async function getContext(
  gh: Octokit,
  params: Parameters,
): Promise<Context> {
  const issueLabels = await getLabelsOnIssueLike(gh, params);
  return new Issue(gh, params, issueLabels);
}
