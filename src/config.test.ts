import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getConfiguration } from './config.js';

describe('getConfiguration', () => {
  it('parses examples/config.yaml', async () => {
    const config = await getConfiguration('examples/config.yaml');
    assert.notEqual(config, undefined);
    assert.deepEqual(config['label-test'], {
      expression: 'set: label-test',
      removeOnMissing: false,
    });
  });
});
