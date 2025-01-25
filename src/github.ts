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
