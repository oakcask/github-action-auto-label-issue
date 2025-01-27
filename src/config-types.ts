import { BareExpression, StructuredExpression } from './ghimex-types.js'

type Arm = ({ removeOnMissing?: boolean } & StructuredExpression) | BareExpression
export type Schema = { [key: string]: Arm }
