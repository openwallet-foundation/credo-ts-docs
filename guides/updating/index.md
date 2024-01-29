import DocCardList from '@theme/DocCardList';

# Updating Credo

This section will cover everything you need to know about updating Credo to a newer version.

<DocCardList />

## Versioning

Credo follows [semantic versioning](https://semver.org/). This means that major version changes (**1**.0.0) are considered breaking changes. When features are added this is a minor version change (0.**1**.0). For bug fixes the patch version change is used (0.0.**1**).

While Credo is still in pre-1.0.0 version, the version change types are shifted to the right. This means a major version change is now a minor change (0.**1**.0) and a minor change is now a patch change (0.0.**1**). This is done to keep the version below 1.0.0, indicating the framework is still in early development and users can expect more breaking changes that when the version has already reached 1.0.0.

This means if the second number in the version (0.**1**.0) changes, you need to be careful with updating and always consult this page for update instructions. If only the third number changes (0.0.**1**), you can update without any issues.

## Types of breaking changes

Updates to Credo bring new features and improvements to the framework. To better adapt the framework to new features we sometimes make breaking changes that will improve how Credo works. There's two parts to updates with breaking changes:

1. Breaking code changes
2. Breaking storage changes

### Breaking Code Changes

Breaking changes to code means changes to how you interact with Credo. This includes methods being renamed, moved to another module or extended to better integrate with new features. We'll try to cover all breaking changes in migration guides, so you know exactly what is needed to update to a new version and keep the same functionality.

:::info

If you encounter any breaking changes that aren't mentioned in the migration docs, please open an issue in the [Credo Docs](https://github.com/openwallet-foundation/credo-ts-docs/issues) repository, or directly create a PR describing the change.

:::

### Breaking Storage Changes

Breaking changes to storage are a bit more complex to deal with. While breaking changes to code only require you to update your code once, breaking changes to storage needs to be updated for every agent instance. Luckily, we've made the migration as easy as possible for you using the [Update Assistant](./update-assistant.md). The Update Assistant will update all storage objects to the storage model that is expected by the newest version. If a version made changes to the storage, this will be explicitly mentioned in the migration guide. See the [Update Assistant](/guides/updating/update-assistant.md) documentation for detailed instructions on how to use the update assistant.

## Migration Guides

Currently the following migration guides are available:

- [Migrating from Credo 0.1.0 to 0.2.x](./versions/0.1-to-0.2.md)
- [Migrating from Credo 0.2.x to 0.3.x](./versions/0.2-to-0.3.md)
- [Migrating from Credo 0.3.x to 0.4.x](./versions/0.3-to-0.4.md)
- [Migrating from an Indy SDK Wallet to Aries Askar](./update-indy-sdk-to-askar.md)
