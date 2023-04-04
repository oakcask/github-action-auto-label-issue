import * as github from '@actions/github'
import { RequestParameters } from '@octokit/graphql/dist-types/types'
import { NextIssueLabelsQuery, NextIssueLabelsQueryVariables } from './generated/graphql'

export type Github = ReturnType<typeof github.getOctokit>

type Query = {
  __typename?: 'Query'
}

function query<TQuery extends Query> (gh: Github, query: string, variables: RequestParameters): Promise<TQuery> {
  return gh.graphql<TQuery>(query, variables)
}

const nextIssueLabelsQuery  = /* GraphQL */ `
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

export async function queryNextIssueLabels (gh: Github, variables: NextIssueLabelsQueryVariables): Promise<NextIssueLabelsQuery> {
  return await query<NextIssueLabelsQuery>(gh, nextIssueLabelsQuery, variables)
}
