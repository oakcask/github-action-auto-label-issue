import type { Octokit } from '@octokit/action'
import type { RequestParameters } from '@octokit/types'
import type { NextIssueLabelsQuery, NextIssueLabelsQueryVariables } from './generated/graphql.js'

type Query = {
  __typename?: 'Query'
}

function query<TQuery extends Query> (gh: Octokit, query: string, variables: RequestParameters): Promise<TQuery> {
  return gh.graphql<TQuery>(query, variables)
}

const nextIssueLabelsQuery = /* GraphQL */ `
  query nextIssueLabels($repo: String!, $owner: String!, $issueNumber: Int!, $pageSize: Int!, $lastEndCursor: String) {
    repository(name: $repo, owner: $owner) {
      issue(number: $issueNumber) {
        labels(first: $pageSize, after: $lastEndCursor) {
          pageInfo {
            endCursor
            hasNextPage
          }
          nodes {
            id
            name
            resourcePath
          }
        }
      }
    }
  }
`

export async function queryNextIssueLabels (gh: Octokit, variables: NextIssueLabelsQueryVariables): Promise<NextIssueLabelsQuery> {
  return await query<NextIssueLabelsQuery>(gh, nextIssueLabelsQuery, variables)
}

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
