// ghimex stands for GitHub Issue Match Expression

interface AnyExpression<T> {
  any: T[]
}

interface AllExpression<T> {
  all: T[]
}

interface LabelExpression {
  label: string
}

interface LabelPatternExpression {
  matchLabel: string
}

interface NotExpression<T> {
  not: T
}

// provides compatiblity
interface PatternExpression {
  pattern: string
}

export type Expression = AnyExpression<Expression> |
  AllExpression<Expression> |
  LabelExpression |
  LabelPatternExpression |
  PatternExpression |
  NotExpression<Expression> |
  string |
  Expression[] | { [key: string]: unknown };

export interface IssueLike {
  body(): string,
  labels(): string[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasOwnProperty (o: any, key: string) {
  return Object.prototype.hasOwnProperty.call(o, key)
}

function cast<TExpression> (e: Expression, key: keyof TExpression): TExpression | undefined {
  if (hasOwnProperty(e, key as unknown as string)) {
    return e as unknown as TExpression
  }
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
  const patternExp = cast<PatternExpression>(e, 'pattern')
  if (patternExp) {
    return new RegExp(patternExp.pattern).test(d.body())
  }
  const labelExp = cast<LabelExpression>(e, 'label')
  if (labelExp) {
    return d.labels().find(o => o === labelExp.label) !== undefined
  }
  const labelPatExp = cast<LabelPatternExpression>(e, 'matchLabel')
  if (labelPatExp) {
    return d.labels().find(o => new RegExp(labelPatExp.matchLabel).test(o)) !== undefined
  }
  const anyExp = cast<AnyExpression<Expression>>(e, 'any')
  if (anyExp) {
    return isMatchAnyExpression(d, anyExp)
  }
  const allExp = cast<AllExpression<Expression>>(e, 'all')
  if (allExp) {
    return isMatchAllExpression(d, allExp)
  }
  const notExp = cast<NotExpression<Expression>>(e, 'not')
  if (notExp) {
    return !isMatch(d, notExp.not)
  }
  return false
}
