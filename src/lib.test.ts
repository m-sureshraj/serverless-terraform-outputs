import { test, describe, mock, afterEach } from 'node:test';
import { deepStrictEqual, strictEqual, throws } from 'node:assert';
import childProcess from 'node:child_process';

import { pick, isObject, getPluginOptions, getTerraformOutputs } from './lib';

describe('lib', () => {
  test('isObject', () => {
    strictEqual(isObject({}), true);

    strictEqual(isObject([]), false);
    strictEqual(isObject(null), false);
    strictEqual(isObject(undefined), false);
    strictEqual(isObject(''), false);
    strictEqual(isObject(1), false);
    strictEqual(isObject(true), false);
  });

  describe('getPluginOptions', () => {
    afterEach(() => {
      mock.reset();
    });

    test('returns the `path` option when it is provided', () => {
      const serverlessInstance = {
        service: {
          custom: {
            ServerlessTerraformOutputs: {
              path: 'test',
            },
          },
        },
      };
      const options = getPluginOptions(serverlessInstance);
      strictEqual(options.path, 'test');
    });

    test('returns the current working directory when the `path` option is not provided', () => {
      const mockedPath = '/foo/is/bar';
      mock.method(process, 'cwd', () => mockedPath);

      const serverlessInstance = {
        service: {},
      };
      const options = getPluginOptions(serverlessInstance);
      strictEqual(options.path, mockedPath);
    });
  });

  describe('getTerraformOutputs', () => {
    test('reads the terraform outputs from the given path', () => {
      const mockedExecSync = mock.method(childProcess, 'execSync', () => ({
        toString: () => JSON.stringify({ foo: 'foo' }),
      }));

      const path = '/some/path';
      getTerraformOutputs(path);

      const call = mockedExecSync.mock.calls[0].arguments;
      deepStrictEqual(call, ['terraform output -json', { cwd: path }]);
    });

    test('throws an error when the output returns an empty object', () => {
      mock.method(childProcess, 'execSync', () => ({
        toString: () => JSON.stringify({}),
      }));

      const path = '/some/path';
      throws(() => getTerraformOutputs(path));
    });

    test('returns the output as an object', () => {
      const tfOutputs = {
        foo: 'foo',
        bar: 'bar',
      };
      mock.method(childProcess, 'execSync', () => ({
        toString: () => JSON.stringify(tfOutputs),
      }));

      const path = '/some/path';
      deepStrictEqual(getTerraformOutputs(path), tfOutputs);
    });
  });

  describe('pick', () => {
    test('throws an error if the attribute is not found', () => {
      const input1 = {
        region: {
          value: 'eu-west-1',
        },
      };
      throws(() => pick('stage', input1), {
        message: 'Could not find the attribute: stage in the given object',
      });

      const input2 = {
        someTopLevelKey: {
          value: {
            region: 'eu-west-1',
          },
        },
      };
      throws(() => pick('someTopLevelKey.stage', input2), {
        message: 'Could not find the attribute: stage in path: someTopLevelKey',
      });
    });

    test('throws an error if the attribute is null', () => {
      const input1 = {
        someTopLevelKey: {
          value: null,
        },
      };
      throws(() => pick('someTopLevelKey', input1), {
        message: 'Picked attribute: someTopLevelKey must not be null',
      });

      const input2 = {
        someTopLevelKey: {
          value: {
            region: null,
          },
        },
      };
      throws(() => pick('someTopLevelKey.region', input2), {
        message: 'Picked attribute: region must not be null',
      });
    });

    test('throws an error when trying to pick an attribute from a non-object', () => {
      const input1 = {
        someTopLevelKey: {
          value: 1,
        },
      };
      throws(() => pick('someTopLevelKey.region', input1), {
        message:
          'Could not find the attribute: region from the non object value: 1, type: number',
      });

      const input2 = {
        someTopLevelKey: {
          value: {
            stage: 1,
          },
        },
      };
      throws(() => pick('someTopLevelKey.stage.dev', input2), {
        message:
          'Could not find the attribute: dev from the non object value: 1, type: number',
      });
    });

    test('throws an error when trying to pick an item from an array', () => {
      const input1 = {
        someTopLevelKey: {
          value: [1, 2, 3],
        },
      };
      throws(() => pick('someTopLevelKey.0', input1), {
        message:
          'Picking attributes from arrays is not supported. Picked attribute: 0 in someTopLevelKey',
      });
    });

    test('picks the attribute', () => {
      const input = {
        region: {
          value: 'eu-west-1',
        },
        stage: {
          value: 'dev',
        },
        someTopLevelKey: {
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

      strictEqual(pick('region', input), 'eu-west-1');
      strictEqual(pick('stage', input), 'dev');
      deepStrictEqual(pick('someTopLevelKey', input), input.someTopLevelKey.value);
      strictEqual(pick('someTopLevelKey.identityPool.keys.key1', input), 'key-1');
      deepStrictEqual(
        pick('someTopLevelKey.tags', input),
        input.someTopLevelKey.value.tags
      );
    });
  });
});
