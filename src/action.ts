import * as core from '@actions/core'
import * as github from '@actions/github'
import { Api } from '@octokit/plugin-rest-endpoint-methods/dist-types/types'
import * as yaml from 'js-yaml'

interface Configuration {
  [label: string]: {
    pattern: RegExp;
    removeOnMissing: boolean;
  };
}

function getIssueNumber (): number | undefined {
  if (github.context.payload.issue) return github.context.payload.issue.number
}

function getIssueBody (): string | undefined {
  return github.context.payload.issue?.body
}

async function getContent (gh: Api, path: string) {
  const r = await gh.rest.repos.getContent({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    path,
    ref: github.context.sha
  })
  const data = r.data as any

  return Buffer.from(data.content, data.encoding).toString()
}

async function addLabels (gh: Api, issueNumber: number, labels: string[]) {
  try {
    await gh.rest.issues.addLabels({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: issueNumber,
      labels
    })
  } catch (e) {
    console.warn(e)
  }
}

function removeLabels (gh: Api, issueNumber: number, labels: string[]) {
  return Promise.all(
    labels.map(async (label) => {
      try {
        await gh.rest.issues.removeLabel({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          issue_number: issueNumber,
          name: label
        })
      } catch (e) {
        console.warn(e)
      }
    })
  )
}

async function getConfiguration (gh: Api, path: string): Promise<Configuration> {
  const configString = yaml.load(await getContent(gh, path)) as any
  return Object.entries(configString).reduce((a, [key, value]) => {
    const n: any = value
    if (typeof n?.pattern === 'string') {
      a[key] = {
        pattern: new RegExp(n.pattern),
        removeOnMissing: n.removeOnMissing ?? false
      }
    }
    return a
  }, {} as Configuration)
}

export async function main () {
  const token = core.getInput('repo-token', { required: true })
  const configPath = core.getInput('configuration-path', { required: true })

  const issueNumber = getIssueNumber()
  const issueBody = getIssueBody()

  if (issueNumber === undefined || issueBody === undefined) {
    console.log('cannot read issue. skipping...')
    return
  }

  const gh = github.getOctokit(token)
  const labelsAdding: string[] = []
  const labelsRemoving: string[] = []

  const config = await getConfiguration(gh, configPath)
  for (const label in config) {
    const labelConfig = config[label]
    if (labelConfig.pattern.test(issueBody)) {
      labelsAdding.push(label)
    } else {
      if (labelConfig.removeOnMissing) {
        labelsRemoving.push(label)
      }
    }
  }

  if (labelsAdding.length > 0) {
    await addLabels(gh, issueNumber, labelsAdding)
  }
  if (labelsRemoving.length > 0) {
    await removeLabels(gh, issueNumber, labelsRemoving)
  }
}
