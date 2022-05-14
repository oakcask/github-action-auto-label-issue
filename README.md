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
      - uses: oakcask/github-action-auto-label-issue@v0.1
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
# add cat label when "cat" is found
cat:
  pattern: cat
# add cow label when "cow" is found.
# remove cow label if "cow" is missing.
cow:
  pattern: cow
  removeOnMissing: true
# add regex label when the specified regular expression pattern is matching.
regex:
  pattern: "[Tt]he.*\\."
```
