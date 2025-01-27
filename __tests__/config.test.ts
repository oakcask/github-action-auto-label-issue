import { describe, it, expect } from 'vitest'
import { getConfiguration } from '../src/config'

describe('getConfiguration', () => {
  it('parses examples/config.yaml', async () => {
    const config = await getConfiguration('examples/config.yaml')
    expect(config).not.toBeUndefined()
    expect(config['label-test']).toStrictEqual({
      expression: 'set: label-test',
      removeOnMissing: false
    })
  })
})
