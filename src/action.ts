import fs from 'node:fs'
import * as core from '@actions/core'
import { isMatch } from './ghimex.js'
import { Octokit } from '@octokit/action'
import { WebhookEvent } from '@octokit/webhooks-types'
import { Context, getIssue } from './issue.js'
import { getConfiguration } from './config.js'

export function parseContext (): Context | undefined {
  const payload = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH!, 'utf8')) as WebhookEvent
  const repo = parseRepo(payload)
  const issue = parseIssue(payload)
  if (issue) {
    return {
      ...repo,
      issue
    }
  }
  const pullRequest = parsePullRequest(payload)
  if (pullRequest) {
    return {
      ...repo,
      pullRequest
    }
  }

  return undefined
}

function parseRepo (payload: WebhookEvent): { owner: string, repo: string } {
  if (process.env.GITHUB_REPOSITORY) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')
    return { owner, repo }
  }
  if ('repository' in payload && payload.repository) {
    return { owner: payload.repository.owner.login, repo: payload.repository.name }
  }

  throw new Error('cannot recognize the repository')
}

function parseIssue (payload: WebhookEvent): { id: string, number: number, body: string } | undefined {
  if ('issue' in payload && payload.issue) {
    return {
      id: payload.issue.node_id,
      number: payload.issue.number,
      body: payload.issue.body || ''
    }
  }
  return undefined
}

function parsePullRequest (payload: WebhookEvent): { id: string, number: number, body: string } | undefined {
  if ('pull_request' in payload && payload.pull_request) {
    return {
      id: payload.pull_request.node_id,
      number: payload.pull_request.number,
      body: payload.pull_request.body || ''
    }
  }
}

export async function main () {
  const configPath = core.getInput('configuration-path', { required: true })
  const octokit = new Octokit()
  const ctx = parseContext()

  if (!ctx) {
    core.info('cannot find a issue or pull request to update.')
    return
  }

  const config = await getConfiguration(configPath)
  const issue = await getIssue(octokit, ctx)
  for (const label in config) {
    const labelConfig = config[label]
    if (isMatch(issue, labelConfig.expression)) {
      issue.addLabel(label)
    } else {
      if (labelConfig.removeOnMissing) {
        issue.removeLabel(label)
      }
    }
  }

  await issue.commitChanges()
}
