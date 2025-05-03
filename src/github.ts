import type { Octokit } from '@octokit/action'
import type { RequestParameters } from '@octokit/types'
import type { NextIssueLabelsQuery, NextIssueLabelsQueryVariables, NextPullRequestLabelsQuery, NextPullRequestLabelsQueryVariables, NextRepositoryLabelsQuery, NextRepositoryLabelsQueryVariables, UpdateLabelsMutation, UpdateLabelsMutationVariables } from './generated/graphql.js'

type Request = {
  __typename?: 'Query' | 'Mutation'
}

function req<T extends Request> (gh: Octokit, query: string, variables: RequestParameters): Promise<T> {
  return gh.graphql<T>(query, variables)
}

const nextIssueLabelsQuery = /* GraphQL */ `
  query nextIssueLabels($repo: String!, $owner: String!, $number: Int!, $pageSize: Int!, $lastEndCursor: String) {
    repository(name: $repo, owner: $owner) {
      issue(number: $number) {
        labels(first: $pageSize, after: $lastEndCursor) {
          pageInfo {
            endCursor
            hasNextPage
          }
          nodes {
            name
          }
        }
      }
    }
  }
`

function queryNextIssueLabels (gh: Octokit, variables: NextIssueLabelsQueryVariables): Promise<NextIssueLabelsQuery> {
  return req(gh, nextIssueLabelsQuery, variables)
}

const nextPullRequestLabelsQuery = /* GraphQL */ `
  query nextPullRequestLabels($repo: String!, $owner: String!, $number: Int!, $pageSize: Int!, $lastEndCursor: String) {
    repository(name: $repo, owner: $owner) {
      pullRequest(number: $number) {
        labels(first: $pageSize, after: $lastEndCursor) {
          pageInfo {
            endCursor
            hasNextPage
          }
          nodes {
            name
          }
        }
      }
    }
  }
`

function queryNextPullRequestLabels (gh: Octokit, variables: NextPullRequestLabelsQueryVariables): Promise<NextPullRequestLabelsQuery> {
  return req(gh, nextPullRequestLabelsQuery, variables)
}

type GetLabelsRequest = {
  repo: string,
  owner: string,
} & ({ issue: { number: number } } | { pullRequest: { number: number } })

export async function getLabelsOnIssueLike (gh: Octokit, { repo, owner, ...issueLike }: GetLabelsRequest): Promise<string[]> {
  const labels: string[] = []
  let lastEndCursor: string | undefined
  let done = false

  while (!done) {
    if ('issue' in issueLike) {
      const res = await queryNextIssueLabels(gh, {
        repo, owner, number: issueLike.issue.number, pageSize: 100, lastEndCursor
      })
      if (!res.repository?.issue?.labels?.nodes) {
        throw Error(`failed to get labels on issue #${issueLike.issue.number}`)
      }
      const { endCursor, hasNextPage } = res.repository.issue.labels.pageInfo
      for (const node of res.repository.issue.labels.nodes) {
        if (node?.name) {
          labels.push(node.name)
        }
      }
      lastEndCursor = endCursor ?? undefined
      done = !hasNextPage
    } else if ('pullRequest' in issueLike) {
      const res = await queryNextPullRequestLabels(gh, {
        repo, owner, number: issueLike.pullRequest.number, pageSize: 100, lastEndCursor
      })
      if (!res.repository?.pullRequest?.labels?.nodes) {
        throw Error(`failed to get labels on pull request #${issueLike.pullRequest.number}`)
      }
      const { endCursor, hasNextPage } = res.repository.pullRequest.labels.pageInfo
      for (const node of res.repository.pullRequest.labels.nodes) {
        if (node?.name) {
          labels.push(node.name)
        }
      }
      lastEndCursor = endCursor ?? undefined
      done = !hasNextPage
    } else {
      throw new Error('unreachable')
    }
  }

  return labels
}

const nextRepositoryLabelsQuery = /* GraphQL */ `
   query nextRepositoryLabels($repo: String!, $owner: String!, $pageSize: Int!, $lastEndCursor: String) {
    repository(name: $repo, owner: $owner) {
      labels(first: $pageSize, after: $lastEndCursor) {
        pageInfo {
          endCursor
          hasNextPage
        }
        nodes {
          id
          name
        }
      }
    }
  }
`

function queryNextRepositoryLabels (gh: Octokit, variables: NextRepositoryLabelsQueryVariables): Promise<NextRepositoryLabelsQuery> {
  return req(gh, nextRepositoryLabelsQuery, variables)
}

interface RepoLabelIdsByName {
  [name: string]: string
}

export async function getRepositoryLabels (gh: Octokit, { repo, owner }: { repo: string, owner: string }): Promise<RepoLabelIdsByName> {
  const labels: RepoLabelIdsByName = {}
  let lastEndCursor: string | undefined
  let done = false

  while (!done) {
    const res = await queryNextRepositoryLabels(gh, {
      repo, owner, pageSize: 100, lastEndCursor
    })
    if (!res.repository?.labels?.nodes) {
      throw Error('failed to get labels of repository')
    }
    const { endCursor, hasNextPage } = res.repository.labels.pageInfo
    for (const node of res.repository.labels.nodes) {
      if (node?.name) {
        labels[node.name] = node.id
      }
    }
    lastEndCursor = endCursor ?? undefined
    done = !hasNextPage
  }

  return labels
}

const updateLabelsMutation = /* GraphQL */ `
  mutation updateLabels(
    $labelableId: ID!
    $labelsToAdd: [ID!]!
    $labelsToRemove: [ID!]!
  ) {
    addLabelsToLabelable(input: {
      labelableId: $labelableId
      labelIds: $labelsToAdd
    }) {
      __typename
    }
    removeLabelsFromLabelable(input: {
      labelableId: $labelableId
      labelIds: $labelsToRemove
    }) { 
      __typename
    }
  }
`

export function updateLabels (gh: Octokit, variables: UpdateLabelsMutationVariables): Promise<UpdateLabelsMutation> {
  return req(gh, updateLabelsMutation, variables)
}
