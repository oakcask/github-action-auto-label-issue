import type { Octokit } from '@octokit/action'
import { queryNextIssueLabels } from './github.js'

export async function enumerateIssueLabels (gh: Octokit, { repo, owner, issueNumber }: { repo: string, owner: string, issueNumber: number }): Promise<string[]> {
  const labels: string[] = []
  let lastEndCursor: string | undefined
  let done = false

  while (!done) {
    const res = await queryNextIssueLabels(gh, {
      repo, owner, issueNumber, pageSize: 100, lastEndCursor
    })
    if (!res.repository?.issue?.labels?.nodes) {
      throw Error('failed to query issue labels')
    }
    const { endCursor, hasNextPage } = res.repository.issue.labels.pageInfo
    for (const node of res.repository.issue.labels.nodes) {
      if (node?.name) {
        labels.push(node.name)
      }
    }

    lastEndCursor = endCursor ?? undefined
    done = !hasNextPage
  }

  return labels
}
