import type { Octokit } from '@octokit/action'
import { enumerateIssueLabels } from './github.js'

export interface Context {
  repo: {
    owner: string,
    repo: string
  }
  ref: string
  issue: {
    number: number,
    body: string
  }
}

export class Issue {
  readonly _octokit: Octokit
  readonly _ctx: Context
  readonly _labels: string[]
  _labelsToAdd: string[] = []
  _labelsToRemove: string[] = []

  constructor (octokit: Octokit, ctx: Context, labels: string[]) {
    this._octokit = octokit
    this._ctx = ctx
    this._labels = labels
  }

  body () {
    return this._ctx.issue.body
  }

  labels () {
    return this._labels
  }

  addLabel (label: string) {
    this._labelsToAdd.push(label)
  }

  removeLabel (label: string) {
    this._labelsToRemove.push(label)
  }

  async commitChanges () {
    if (this._labelsToAdd.length > 0) {
      await addLabels(this._octokit, this._ctx, this._labelsToAdd)
    }
    if (this._labelsToRemove.length > 0) {
      await removeLabels(this._octokit, this._ctx, this._labelsToRemove)
    }
  }
}

export async function getIssue (gh: Octokit, ctx: Context): Promise<Issue> {
  const issueLabels: string[] = await getIssueLabels(gh, ctx)
  return new Issue(gh, ctx, issueLabels)
}

async function addLabels (gh: Octokit, ctx: Context, labels: string[]) {
  try {
    await gh.rest.issues.addLabels({
      owner: ctx.repo.owner,
      repo: ctx.repo.repo,
      issue_number: ctx.issue.number,
      labels
    })
  } catch (e) {
    console.warn(e)
  }
}

function removeLabels (gh: Octokit, ctx: Context, labels: string[]) {
  return Promise.all(
    labels.map(async (label) => {
      try {
        await gh.rest.issues.removeLabel({
          owner: ctx.repo.owner,
          repo: ctx.repo.repo,
          issue_number: ctx.issue.number,
          name: label
        })
      } catch (e) {
        console.warn(e)
      }
    })
  )
}

async function getIssueLabels (
  gh: Octokit,
  { issue: { number: issueNumber }, repo: { owner, repo } }: { issue: { number: number }, repo: { owner: string, repo: string }}) {
  return await enumerateIssueLabels(gh, {
    repo,
    owner,
    issueNumber
  })
}
