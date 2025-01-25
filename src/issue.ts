import type { Octokit } from '@octokit/action'
import { getLabelsOnIssueLike, getRepositoryLabels, updateLabels } from './github.js'
import * as core from '@actions/core'

export type Context = {
  owner: string,
  repo: string
} & (
  {
    issue: {
      id: string,
      number: number,
      body: string,
    }
  } | {
    pullRequest: {
      id: string,
      number: number,
      body: string
    }
  })

class Issue {
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
    if ('issue' in this._ctx) {
      return this._ctx.issue.body
    } else {
      return this._ctx.pullRequest.body
    }
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
    await this.updateLabels()
  }

  async updateLabels () {
    const repoLabels = await getRepositoryLabels(this._octokit, this._ctx)
    const labelsToAdd = this._labelsToAdd.map(name => {
      if (name in repoLabels) {
        return repoLabels[name]
      }
      core.warning(`ignoring missing label: ${name}`)
      return undefined
    }).filter(id => typeof id === 'string')
    const labelsToRemove = this._labelsToRemove.map(name => {
      if (name in repoLabels) {
        return repoLabels[name]
      }
      core.warning(`ignoring missing label: ${name}`)
      return undefined
    }).filter(id => typeof id === 'string')

    const labelableId = 'issue' in this._ctx ? this._ctx.issue.id : this._ctx.pullRequest.id
    await updateLabels(this._octokit, {
      labelableId,
      labelsToAdd,
      labelsToRemove
    })
  }
}

export async function getIssue (gh: Octokit, ctx: Context): Promise<Issue> {
  const issueLabels = await getLabelsOnIssueLike(gh, ctx)
  return new Issue(gh, ctx, issueLabels)
}
