[![CI Status](https://github.com/oakcask/github-action-auto-label-issue/actions/workflows/check.yaml/badge.svg)](https://github.com/oakcask/github-action-auto-label-issue/actions/workflows/check.yaml)

# github-action-auto-label-issue

This is yet another github.com/github/labeler clone.

## Getting Started

### Configuring Github Actions

Add workflow invokes github-action-auto-label-issue like below,
and place it under `.github/workflows` directory.

```yaml
name: "Auto Labeling"
on:
  issues:
    types: [opened, edited]

jobs:
  mark:
    runs-on: ubuntu-latest
    steps:
      - uses: oakcask/github-action-auto-label-issue@v1
        with:
          repo-token: "${{ secrets.GITHUB_TOKEN }}"
          configuration-path: .github/auto-label.yml
```

### Configuring Labels

Now, write labeling rules to the YAML file pointed by `configuration-path`.

```yaml
# add fox label when "fox" is found
fox:
  pattern: fox
# add cat label when "cat" is found. Array is also accepted as an "all" expression.
cat:
  - cat

# add cow label when "cow" is found.
# remove cow label if "cow" is missing.
cow:
  pattern: cow
  removeOnMissing: true
# add regex label when the specified regular expression pattern is matching.
regex:
  pattern: "[Tt]he.*\\."
```

For more complecated use cases, we can utilize complex expressions like:

```yaml
bat:
  # Matches against phrase like "bat is animal and has wings".
  # but "birds have wings." won't match.
  all:
    - wings?
    - animal
  # "all" can be reducted in this case; because an naked array will be treated as child node of "all":
bat2:
  - wings?
  - animal
```

```yaml
pirate:
  # To detect pirates in issue, check any appearences of `Ahoy`, `matey`, `Rrrr!` and so on.
  any:
    - "[Aa]hoy"
    - "[Mm]atey"
    - ([AR]a*|Ya+)rrr+!
    # pirate:caribbean, pirate:barbary, prirate:ottoman or any pirates will be also labelled as "pirate".
    - labelMatch: |-
      ^pirate:

# If the pirate talks about "rum", he must be a caribbean pirate.
pirate:caribbean:
  - label: rum
  - any:
      - "[Aa]hoy"
      - "[Mm]atey"
      - ([AR]a*|Ya+)rrr+!
```
