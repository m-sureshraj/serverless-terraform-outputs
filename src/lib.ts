import { execSync } from 'node:child_process';

import type Serverless from 'serverless';

import type { TerraformOutputs, PluginOptions, RootLevelValue } from './types.js';

export function getTerraformOutputs(path: string) {
  const outputs = execSync('terraform output -json', { cwd: path }).toString('utf-8');

  const parsed: TerraformOutputs = JSON.parse(outputs);
  if (Object.keys(parsed).length === 0) {
    const errorMessage = [
      `No Terraform outputs found in path: ${path}`,
      '- Ensure the `path` option is set through `ServerlessTerraformOutputs` if your Terraform state is not in the current working directory.',
      '- Try running `terraform output -json` to verify that the expected outputs are present.',
    ].join('\n');
    throw new Error(errorMessage);
  }

  return parsed;
}

export function getPluginOptions(serverless: Serverless): PluginOptions {
  const options = serverless.service.custom?.ServerlessTerraformOutputs ?? {};

  return {
    path: options.path ?? process.cwd(),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  return true;
}

/**
 * Picks an attribute from the output generated by terraform output (terraform output -json)
 * Picked attribute must be a non-null
 * Nested attributes can be picked only from objects
 * Array indexes are not supported. i.e. pick('foo.0', { foo: [1, 2] })
 */
export function pick(
  attributePath: string,
  sourceObject: TerraformOutputs | TerraformOutputs<unknown>,
  isRootLevel = true,
  accumulatedPath: string[] = []
): unknown {
  const [part, ...remainingPath] = attributePath.split('.');

  if (sourceObject[part] === undefined) {
    const path = accumulatedPath.length
      ? `in path: ${accumulatedPath.join('.')}`
      : 'in the given object';
    throw new Error(`Could not find the attribute: ${part} ${path}`);
  }

  // In terraform outputs, the values at the root level are contained within the `value` property
  const currentValue = isRootLevel
    ? (sourceObject[part] as RootLevelValue).value
    : sourceObject[part];

  // SLS expects the value to be non-null
  if (currentValue === null) {
    throw new Error(`Picked attribute: ${part} must not be null`);
  }

  const isValueObject = isObject(currentValue);
  if (isValueObject && remainingPath.length > 0) {
    return pick(remainingPath.join('.'), currentValue, false, [...accumulatedPath, part]);
  }

  // if the current value is a non-object but an attribute is picked from it, throw error.
  if (!isValueObject && remainingPath.length > 0) {
    throw new Error(
      `Could not find the attribute: ${part} from the non object value: ${currentValue}, type: ${typeof currentValue}`
    );
  }

  return currentValue;
}
