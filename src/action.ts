import fs from 'node:fs'
import * as core from '@actions/core'
import * as yaml from 'js-yaml'
import { Expression, isMatch } from './expression.js'
import { enumerateIssueLabels } from './issue.js'
import { Octokit } from '@octokit/action'
import { WebhookEvent } from '@octokit/webhooks-types'

interface Configuration {
  [label: string]: {
    expression: Expression
    removeOnMissing: boolean;
  };
}

interface Context {
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

async function getContent (gh: Octokit, ctx: Context, path: string) {
  const r = await gh.rest.repos.getContent({
    owner: ctx.repo.owner,
    repo: ctx.repo.repo,
    path,
    ref: ctx.ref
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = r.data as any

  return Buffer.from(data.content, data.encoding).toString()
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

async function getConfiguration (gh: Octokit, ctx: Context, path: string): Promise<Configuration> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const configString = yaml.load(await getContent(gh, ctx, path)) as any
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

async function getIssueLabels (
  gh: Octokit,
  { issue: { number: issueNumber }, repo: { owner, repo } }: { issue: { number: number }, repo: { owner: string, repo: string }}) {
  return await enumerateIssueLabels(gh, {
    repo,
    owner,
    issueNumber
  })
}

export async function main () {
  const configPath = core.getInput('configuration-path', { required: true })
  const octokit = new Octokit()
  const ctx = parseContext()

  if (!ctx) {
    console.log('cannot read issue. skipping...')
    return
  }

  const labelsAdding: string[] = []
  const labelsRemoving: string[] = []
  const issueLabels: string[] = await getIssueLabels(octokit, ctx)

  const config = await getConfiguration(octokit, ctx, configPath)
  for (const label in config) {
    const labelConfig = config[label]
    if (isMatch({ body: ctx.issue.body, labels: issueLabels }, labelConfig.expression)) {
      labelsAdding.push(label)
    } else {
      if (labelConfig.removeOnMissing) {
        labelsRemoving.push(label)
      }
    }
  }

  if (labelsAdding.length > 0) {
    await addLabels(octokit, ctx, labelsAdding)
  }
  if (labelsRemoving.length > 0) {
    await removeLabels(octokit, ctx, labelsRemoving)
  }
}
