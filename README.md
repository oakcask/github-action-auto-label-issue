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

jobs:
  example:
    runs-on: ubuntu-latest
    steps:
      - name: example executing a inline rulebook
        uses: oakcask/github-action-auto-label-issue@v2
        with:
          token: "${{ secrets.GITHUB_TOKEN }}"
          rulebook: |-
            - id: detect-caribbean-pirate-in-issue
              when:
                - label: label-test
                - all: &detect-caribbean-pirate-in-issue
                  - label: label-test:rum
                  - any:
                    - "[Aa]hoy"
                    - "[Mm]atey"
                    - ([AR]a*|Ya+)rrr+!
              then:
                - addLabel: label-test:pirate:caribbean
            - id: reverse-detect-caribbean-pirate-in-issue
              when:
                - label: label-test
                - not: *detect-caribbean-pirate-in-issue
              then:
                - removeLabel: label-test:pirate:caribbean
```

### Configuring Rules

Use `rulebook` input parameter to pass a list of rules inline.
Or `rulebook-path` input parameter to point a external file contains the rulebook.

#### Syntax

Rulebook is a YAML-based DSL to describe rules and actions to execute.
A Rulebook contains one Rule or a list of Rules.

```yaml
  # id used for name this rule.
- id: detect-pirate
  when:
    # when-clause is the condition to test against a issue-like item (issues or pull requests).
    all: # when all the conditions below match:
      - label: rum # when the item is labeled as "rum".
      - any: # when any conditions below match:
          # String is interpreted as regular expression. And tested against the body of the item.
          # In this case, this condition is matched
          # when the body contains like "Ahoy", "matey", "Yaaaarrrrr!", etc. 
          - "[Aa]hoy" 
          - "[Mm]atey"
          - ([AR]a*|Ya+)rrr+!
  then:
    # then-clause is list of action executed when the condition are met.
    - addLabel: pirate
    - addLabel: pirate:caribbean
```

Check out the [example rulebook](./examples/rulebook.yaml).

### Legacy Configuration

In version 1, labeling rules are called "configuration",
stored in a YAML file pointed by `configuration-path` input parameter.

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
    - matchLabel: |-
        ^pirate:

# If the pirate talks about "rum", he must be a caribbean pirate.
pirate:caribbean:
  - label: rum
  - any:
      - "[Aa]hoy"
      - "[Mm]atey"
      - ([AR]a*|Ya+)rrr+!
```
