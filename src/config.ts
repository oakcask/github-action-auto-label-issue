import fs from 'node:fs';
import util from 'node:util';
import * as yaml from 'js-yaml';
import * as core from '@actions/core';
import type { Schema } from './config-types.js';
import CONFIG_SCHEMA from './generated/config.schema.json' with {
  type: 'json',
};
import { Ajv } from 'ajv';
import type { Expression } from './ghimex-types.js';

const schema = new Ajv({ loadSchema: async () => ({}) }).compileAsync<Schema>(
  CONFIG_SCHEMA,
);

export interface Configuration {
  [key: string]: {
    removeOnMissing: boolean;
    expression: Expression;
  };
}

async function parse(data: any): Promise<Schema | undefined> {
  const validate = await schema;
  if (validate(data)) {
    return data;
  }

  for (const e of validate.errors || []) {
    core.error(util.format('%o', e));
  }
}

export async function getConfiguration(path: string): Promise<Configuration> {
  const config = await parse(yaml.load(fs.readFileSync(path, 'utf-8')));

  if (typeof config !== 'undefined') {
    return Object.entries(config).reduce((a, [key, value]) => {
      if (typeof value === 'object' && value && 'removeOnMissing' in value) {
        const { removeOnMissing, ...expression } = value;
        a[key] = {
          expression,
          removeOnMissing:
            typeof removeOnMissing === 'boolean' && removeOnMissing,
        };
      } else if (typeof value === 'string') {
        a[key] = {
          expression: value,
          removeOnMissing: false,
        };
      } else if (Array.isArray(value)) {
        a[key] = {
          expression: value,
          removeOnMissing: false,
        };
      }
      return a;
    }, {} as Configuration);
  }

  core.error('invalid configuration');
  return {};
}
