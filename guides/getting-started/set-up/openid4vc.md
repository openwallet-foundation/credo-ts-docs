# OpenID for Verifiable Credentials

The OpenID4VC module provides support for the [OpenID for Verifiable Credentials group of protocols](https://openid.net/sg/openid4vc/) defined under the OpenID Foundation. Currently this includes the [OpenID for Verifiable Credential Issuance](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html), [Self-Issued OpenID Provider v2](https://openid.net/specs/openid-connect-self-issued-v2-1_0.html), and [OpenID for Verifiable Presentations](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html).

For the current supported versions for any of the OpenID4VC protocols, please refer to the [OpenID4VC Feature](../../features/openid4vc.md) page.

The OpenID4VC Module in Credo currently exposes three modules, one for each role in the triangle trust: `OpenId4VcIssuerModule`, `OpenId4VcHolderModule`, and `OpenId4VcVerifierModule`. The issuer and verifier modules are expected to run in a cloud environment, as they require several endpoints to be exposed to the public internet. The holder module can run in a cloud environment or on a mobile device.

### Installing OpenID4VC Module

When using Credo with OpenID4VC you need to install the `@credo-ts/openid4vc` module:

```console
yarn add @credo-ts/openid4vc@0.5.3
```

### Adding OpenID4VC Modules to the Agent

After installing the dependencies, we can register the the different modules on the agent.

#### Issuer and Verifier

If you want to issue or verify credentials using OpenID for Verifiable Credentials, you can add the `OpenId4VcIssuerModule` and the `OpenId4VcVerifierModule`. These modules can only run on the server, in Node.js and don't work in a React Native environment. These modules can be added separately, it's not required to use both modules. The set up for the issuer and verifier module can be combined with the set up for the holder module below to support issuance, holding, and verification OpenID4VC flows within the same agent.

In the example we haven't implemented the `credentialRequestToCredentialMapper` method for the issuer module yet, this is covered in the [OpenID4VC Guides](/guides/tutorials/openid4vc).

```typescript showLineNumbers set-up-openid4vc-issuer-verifier.ts section-1

```

### Holder

If you want to receive and present credentials using OpenID for Verifiable Credentials, you can add the `OpenId4VcHolderModule`. This module can run in both Node.js and React Native.

```typescript showLineNumbers set-up-openid4vc-holder.ts section-1

```
