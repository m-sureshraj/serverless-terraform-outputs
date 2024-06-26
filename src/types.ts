export type RootLevelValue = {
  value: unknown;
};

export type TerraformOutputs<Value = RootLevelValue> = {
  [key: string]: Value;
};

export type PluginOptions = {
  path: string;
};

// The reasons for defining custom Serverless types instead of using @types/serverless are as follows:
// - JSR couldn't generate documentation when using @types/serverless.
// - To keep the type definitions strict and scoped to this plugin's requirements.
export interface Serverless {
  service: {
    custom?: {
      ServerlessTerraformOutputs?: {
        path?: string;
      };
    };
  };
}

export interface Plugin {
  configurationVariablesSources: {
    [variablePrefix: string]: {
      resolve: (variableSource: { address: string }) => Promise<{ value: unknown }>;
    };
  };
}
