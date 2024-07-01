import { describe, test, mock, afterEach } from 'node:test';
import { deepStrictEqual } from 'node:assert';
import childProcess from 'node:child_process';

import ServerlessTerraformOutputs from './index';

describe('index', () => {
  afterEach(() => {
    mock.reset();
  });

  test('resolves', async () => {
    // Ideally, the imported methods from `lib` should be mocked directly.
    // However, the Node.js v20 (required by this plugin) test-runner does not support module mocking (mock.module) until v23.
    // Hence, mocking methods used by the function exported from `lib`.
    const mockedPath = '/path/to/terraform-dir';
    mock.method(process, 'cwd', () => mockedPath);

    const tfOutputs = {
      region: {
        value: 'eu-west-1',
      },
      stage: {
        value: 'dev',
      },
      auth: {
        value: {
          bucketName: 'my-bucket',
          userPoolName: 'foo',
          identityPool: {
            name: 'bar',
            id: 'uuid',
            isEnabled: true,
            count: 100,
            keys: {
              key1: 'key-1',
            },
          },
          tags: ['one', 'two'],
        },
      },
    };
    mock.method(childProcess, 'execSync', () => ({
      toString: () => JSON.stringify(tfOutputs),
    }));

    const ServerlessInstance = {
      service: {
        custom: {
          ServerlessTerraformOutputs: {
            path: mockedPath,
          },
        },
      },
    };
    const pluginInstance = new ServerlessTerraformOutputs(ServerlessInstance);
    const { resolve } = pluginInstance.configurationVariablesSources.TF;

    deepStrictEqual(await resolve({ address: 'region' }), {
      value: 'eu-west-1',
    });

    deepStrictEqual(await resolve({ address: 'stage' }), {
      value: 'dev',
    });

    deepStrictEqual(await resolve({ address: 'auth.identityPool' }), {
      value: tfOutputs.auth.value.identityPool,
    });

    deepStrictEqual(await resolve({ address: 'auth.identityPool.keys.key1' }), {
      value: 'key-1',
    });

    deepStrictEqual(await resolve({ address: 'auth.tags' }), {
      value: tfOutputs.auth.value.tags,
    });
  });
});
