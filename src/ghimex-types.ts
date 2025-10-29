// ghimex stands for GitHub Issue Match Expression

export interface AnyExpression<T> {
  any: T[];
}

export interface AllExpression<T> {
  all: T[];
}

export interface LabelExpression {
  label: string;
}

export interface LabelPatternExpression {
  matchLabel: string;
}

export interface NotExpression<T> {
  not: T;
}

// provides compatiblity
export interface PatternExpression {
  pattern: string;
}

export type Expression =
  | AnyExpression<Expression>
  | AllExpression<Expression>
  | LabelExpression
  | LabelPatternExpression
  | PatternExpression
  | NotExpression<Expression>
  | string
  | Expression[];

type Structured<T extends Expression> = T extends Expression[]
  ? never
  : T extends string
    ? never
    : T;
type Bare<T extends Expression> = T extends Structured<T> ? never : T;

export type StructuredExpression = Structured<Expression>;
export type BareExpression = Bare<Expression>;
