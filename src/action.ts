import fs from 'node:fs'
import * as core from '@actions/core'
import * as yaml from 'js-yaml'
import { Expression, isMatch } from './ghimex.js'
import { Octokit } from '@octokit/action'
import { WebhookEvent } from '@octokit/webhooks-types'
import { Context, getIssue } from './issue.js'

interface Configuration {
  [label: string]: {
    expression: Expression
    removeOnMissing: boolean;
  };
}

export function parseContext (): Context | undefined {
  const payload = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH!, 'utf8')) as WebhookEvent
  const issue = parseIssue(payload)
  if (issue) {
    return {
      repo: parseRepo(payload),
      ref: process.env.GITHUB_REF!,
      issue
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

function parseIssue (payload: WebhookEvent): { number: number, body: string } | undefined {
  if ('issue' in payload && payload.issue) {
    return { number: payload.issue.number, body: payload.issue.body || '' }
  }
  return undefined
}

function getConfiguration (path: string): Configuration {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const configString = yaml.load(fs.readFileSync(path, 'utf-8')) as any
  return Object.entries(configString).reduce((a, [key, value]) => {
    if (Array.isArray(value)) {
      a[key] = {
        expression: value,
        removeOnMissing: false
      }
    } else {
      const item = value as { [key: string]: unknown }
      const { removeOnMissing, ...expression } = item
      a[key] = {
        expression,
        removeOnMissing: typeof removeOnMissing === 'boolean' && removeOnMissing
      }
    }

    return a
  }, {} as Configuration)
}

export async function main () {
  const configPath = core.getInput('configuration-path', { required: true })
  const octokit = new Octokit()
  const ctx = parseContext()

  if (!ctx) {
    console.log('cannot read issue. skipping...')
    return
  }

  const config = getConfiguration(configPath)
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
