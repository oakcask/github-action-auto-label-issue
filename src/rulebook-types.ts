import type { Expression } from './ghimex-types.js'

interface Metadata {
  id?: string
}

export type Action
  = { addLabel: string }
  | { removeLabel: string }

interface ConditionClause {
  when: Expression
}

interface ActionClause {
  then?: Action[]
}

export type Rule
  = Metadata
  & ConditionClause
  & ActionClause

type Rulebook = Rule[] | Rule

export type Schema = Rulebook
