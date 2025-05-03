import fs from 'node:fs/promises'
import util from 'node:util'
import * as core from '@actions/core'
import yaml from 'js-yaml'
import SCHEMA_JSON from './generated/rulebook.schema.json' with { type: 'json' }
import type { Schema, Rule, Action } from './rulebook-types.js'
import { Ajv } from 'ajv'
import type { Configuration } from './config.js'
import type { Context } from './context.js'
import { isMatch } from './ghimex.js'

export type Rulebook = Schema

const schema = new Ajv({ loadSchema: async () => ({}) })
  .compileAsync<Rulebook>(SCHEMA_JSON)

type LoadOption
  = { path: string }
  | string

export async function loadRulebook (option: LoadOption): Promise<Rulebook | undefined> {
  if (typeof option === 'object' && 'path' in option) {
    return loadRulebook(await fs.readFile(option.path, 'utf8'))
  }
  const validate = await schema
  const json = yaml.load(option)
  if (validate(json)) {
    return json
  }
  if (validate.errors) {
    for (const e of validate.errors) {
      core.error(util.format('%o', e))
    }
  }
}

export function loadLegacyRule (configuration: Configuration): Rulebook {
  const rules: Rule[] = []

  for (const label in configuration) {
    const { removeOnMissing, expression } = configuration[label]

    rules.push({
      when: expression,
      then: [{ addLabel: label }]
    })
    if (removeOnMissing) {
      rules.push({
        when: { not: expression },
        then: [{ removeLabel: label }]
      })
    }
  }

  return rules
}

function executeAction (context: Context, action: Action) {
  if ('addLabel' in action) {
    context.onAddLabel(action.addLabel)
  }
  if ('removeLabel' in action) {
    context.onRemoveLabel(action.removeLabel)
  }
}

function executeRule (context: Context, rule: Rule) {
  const { id, when: condition, then: actions } = rule

  if (isMatch(context, condition)) {
    if (id) {
      core.debug(util.format('rule(id: %s) matched', id))
    }
    if (actions) {
      for (const action of actions) {
        executeAction(context, action)
      }
    }
  }
}

export async function executeRulebook (context: Context, rule: Rulebook) {
  if (Array.isArray(rule)) {
    for (const r of rule) {
      executeRule(context, r)
    }
  } else {
    executeRule(context, rule)
  }

  await context.finish()
}
