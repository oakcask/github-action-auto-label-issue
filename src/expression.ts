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

// provides compatiblity
interface PatternExpression {
  pattern: string
}

export type Expression = AnyExpression<Expression> |
  AllExpression<Expression> |
  LabelExpression |
  LabelPatternExpression |
  PatternExpression |
  string |
  Expression[] | { [key: string]: unknown };

export interface Document {
  body: string,
  labels: string[]
}

function hasOwnProperty (o: any, key: string) {
  return Object.prototype.hasOwnProperty.call(o, key)
}

function cast<TExpression> (e: Expression, key: keyof TExpression): TExpression | undefined {
  if (hasOwnProperty(e, key as unknown as string)) {
    return e as unknown as TExpression
  }
}

function isMatchAllExpression (d: Document, exps: Expression[] | AllExpression<Expression>): boolean {
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

function isMatchAnyExpression (d: Document, exp: AnyExpression<Expression>): boolean {
  for (const e of exp.any) {
    if (isMatch(d, e)) {
      return true
    }
  }
  return false
}

export function isMatch (d: Document, e: Expression): boolean {
  if (typeof e === 'string') {
    return new RegExp(e).test(d.body)
  }
  if (Array.isArray(e)) {
    return isMatchAllExpression(d, e)
  }
  const patternExp = cast<PatternExpression>(e, 'pattern')
  if (patternExp) {
    return new RegExp(patternExp.pattern).test(d.body)
  }
  const labelExp = cast<LabelExpression>(e, 'label')
  if (labelExp) {
    return d.labels.find(o => o === labelExp.label) !== undefined
  }
  const labelPatExp = cast<LabelPatternExpression>(e, 'matchLabel')
  if (labelPatExp) {
    return d.labels.find(o => new RegExp(labelPatExp.matchLabel).test(o)) !== undefined
  }
  const anyExp = cast<AnyExpression<Expression>>(e, 'any')
  if (anyExp) {
    return isMatchAnyExpression(d, anyExp)
  }
  const allExp = cast<AllExpression<Expression>>(e, 'all')
  if (allExp) {
    return isMatchAllExpression(d, allExp)
  }
  return false
}
