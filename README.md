# serverless-terraform-outputs

[Serverless framework](https://www.serverless.com/) plugin to reference outputs from Terraform.

> [!NOTE]
> The Serverless Framework v4 offers a feature, [Terraform Variable Resolver](https://www.serverless.com/framework/docs/guides/variables/terraform#resolvers-in-serverless-framework-v4),
> which allows you to directly reference Terraform outputs in the `serverless.yml` file without needing a plugin.
> I recommend using this feature instead of relying on a plugin.

#### At a Glance

- It allows nested attributes to be picked from objects.
- The picked attribute must be a non-null value.
- It doesn't support picking items from arrays.
- It's an ESM-only module.

## Pre-requisites

- Serverless framework `v3` or higher
- Node.js version `v20` or higher
- Ensure the `terraform` command is available in your PATH

## Installation

This plugin is an ESM-only module available on the [JavaScript Registry](https://jsr.io/) for the Node.js runtime.

```bash
npx jsr add --save-dev  @halfstack/serverless-terraform-outputs
```

Add the plugin to your `serverless.yml` configuration:

```yml
plugins:
  - '@halfstack/serverless-terraform-outputs'
```

## Configuration

The plugin can be configured using the `ServerlessTerraformOutputs` option.

### path

Optionally, specify the path to the Terraform files. Otherwise, the plugin assumes the current working directory.
Here is the configuration if the files are located in a directory named `infra`:

```
├── project
    ├── infra
    ├── src
    └── serverless.yml
```

```yml
# serverless.yml

custom:
  ServerlessTerraformOutputs:
    path: './infra'
```

## Usage

The reference in the `serverless.yml` file should begin with the `${TF:}` prefix, followed by the path to the 
variable in the Terraform outputs. Here's an example:

```terraform
# /infra/main.tf

output "user-uploads-bucket-name" {
  value = aws_s3_bucket.user-uploads-bucket.bucket
}

output "main" {
  value = {
    stage = "dev"
    region = "eu-west-1"
    identityPool = {
      name = "hello-world"
      url = "https://example.com"
    }
    tags = ["tag-1", "tag-2"]
  }
}
```

```yml
# serverless.yml

service: some-service

provider:
  name: aws
  stage: ${TF:main.stage}
  region: ${TF:main.region}

custom:
  tags: ${TF:main.tags}

functions:
  hello:
    handler: handler.hello
    environment:
      userUploadsBucket: ${TF:user-uploads-bucket-name}
      identityPoolUrl: ${TF:main.identityPool.url}
```

## License

MIT

## Credits

I read these projects, which solved the exact problem this plugin addresses, to understand their approach. 
However, this plugin has taken a different implementation approach.

* [serverless-terraform-outputs](https://github.com/rundeck/serverless-terraform-outputs/tree/master)
* [serverless-terraform-variables](https://github.com/sbchapin/serverless-terraform-variables/tree/master)
