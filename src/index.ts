import { getPluginOptions, getTerraformOutputs, pick } from './lib';
import { Plugin, Serverless } from './types';

/**
 * A Serverless framework [plugin](https://www.serverless.com/framework/docs/guides/plugins)
 * to reference outputs from Terraform.
 *
 * This plugin registers the [custom variable source](https://www.serverless.com/framework/docs/guides/plugins/custom-variables) `${TF:}`.
 * The framework calls the `resolve` method for each variable that starts with `${TF:}` in `serverless.yml`.
 * For example, `${TF:foo.bar}` will invoke the method with `{ address: 'foo.bar' }`.
 * The method must return an object with the `value` property, and the value of the property must be non-null.
 *
 * The path of the Terraform directory can be configured via the `path` option.
 * Otherwise, the plugin tries to read the Terraform outputs using `terraform output -json` from the current working directory (`process.cwd()`)
 * and fails if no outputs are found or if the output is an empty object.
 *
 * This is an ESM-only module.
 *
 * @module
 */
export default class ServerlessTerraformOutputs implements Plugin {
  public configurationVariablesSources: Plugin['configurationVariablesSources']

  constructor(serverless: Serverless) {
    const { path } = getPluginOptions(serverless);
    const outputs = getTerraformOutputs(path);

    this.configurationVariablesSources = {
      TF: {
        async resolve({ address }) {
          return {
            value: pick(address, outputs),
          };
        },
      },
    };
  }
}
