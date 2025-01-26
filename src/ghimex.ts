import { AllExpression, AnyExpression, Expression as Exp } from './ghimex-types.js'

export type Expression = Exp

export interface IssueLike {
  body(): string,
  labels(): string[]
}

function isMatchAllExpression (d: IssueLike, exps: Expression[] | AllExpression<Expression>): boolean {
  if (Array.isArray(exps)) {
    for (const e of exps) {
      if (!isMatch(d, e)) {
        return false
      }
    }

    return true
  }

  for (const e of exps.all) {
    if (!isMatch(d, e)) {
      return false
    }
  }
  return true
}

function isMatchAnyExpression (d: IssueLike, exp: AnyExpression<Expression>): boolean {
  for (const e of exp.any) {
    if (isMatch(d, e)) {
      return true
    }
  }
  return false
}

export function isMatch (d: IssueLike, e: Expression): boolean {
  if (typeof e === 'string') {
    return new RegExp(e).test(d.body())
  }
  if (Array.isArray(e)) {
    return isMatchAllExpression(d, e)
  }
  if ('pattern' in e) {
    return new RegExp(e.pattern).test(d.body())
  }
  if ('label' in e) {
    return d.labels().find(o => o === e.label) !== undefined
  }
  if ('matchLabel' in e) {
    return d.labels().find(o => new RegExp(e.matchLabel).test(o)) !== undefined
  }
  if ('any' in e) {
    return isMatchAnyExpression(d, e)
  }
  if ('all' in e) {
    return isMatchAllExpression(d, e)
  }
  if ('not' in e) {
    return !isMatch(d, e.not)
  }
  return false
}
