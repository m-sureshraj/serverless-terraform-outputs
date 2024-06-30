import { getPluginOptions, getTerraformOutputs, pick } from './lib';
import { Plugin, Serverless } from './types';

// https://www.serverless.com/framework/docs/guides/plugins
export default class ServerlessTerraformOutputs implements Plugin {
  public configurationVariablesSources: Plugin['configurationVariablesSources']

  constructor(serverless: Serverless) {
    const { path } = getPluginOptions(serverless);
    const outputs = getTerraformOutputs(path);

    // https://www.serverless.com/framework/docs/guides/plugins/custom-variables
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
