import type { ConfigurationVariablesSources } from 'serverless/classes/Plugin.js';

export type RootLevelValue = {
  value: unknown;
};

export type TerraformOutputs<Value = RootLevelValue> = {
  [key: string]: Value;
};

export type PluginOptions = {
  path: string;
};

export interface Plugin {
  configurationVariablesSources: ConfigurationVariablesSources;
}
