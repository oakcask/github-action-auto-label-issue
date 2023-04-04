import { Github, queryNextIssueLabels } from "./github";

export async function enumerateIssueLabels(gh: Github, { repo, owner, issueNumber }: { repo: string, owner: string, issueNumber: number }): Promise<string[]> {
  const labels: string[] = []
  let lastEndCursor: string | undefined = undefined
  let done = false

  while (!done) {
    const res = await queryNextIssueLabels(gh, {
      repo, owner, issueNumber, pageSize: 100, lastEndCursor,
    });
    if (!res.repository?.issue?.labels?.nodes) {
      throw Error("failed to query issue labels")
    }
    const { endCursor, hasNextPage } = res.repository.issue.labels.pageInfo
    for (let node of res.repository.issue.labels.nodes) {
      if (node?.name) {
        labels.push(node.name)
      }
      node?.name
    }

    lastEndCursor = endCursor ?? undefined
    done = !hasNextPage
  }

  return labels
}