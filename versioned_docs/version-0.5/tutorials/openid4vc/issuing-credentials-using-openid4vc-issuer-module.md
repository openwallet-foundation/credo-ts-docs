# Issuing Credentials using the OpenID4VC Issuer Module

This tutorial will guide you through the process of issuing credentials using the OpenID4VC Issuer Module. Before starting this tutorial, make sure you have completed the [OpenID4VC Issuer Module Setup](/guides/getting-started/set-up/openid4vc.md).

This guides only covers the issuance of credentials using the OpenID4VC Issuer Module. Follow the [Receiving and Proving Credentials using the OpenID4VC Holder Module](/guides/tutorials/openid4vc/receiving-and-proving-credentials-using-openid4vc-holder-module.md) guide to learn how to receive and prove credentials using the OpenID4VC Holder Module.

## Creating the issuer

Once you have set-up your agent (under `issuer` variable), we first need to configure your issuer and the credentials you want to issue.

```typescript showLineNumbers sd-jwt-vc-openid4vc.ts section-2

```

If you want to update the display metadata or the credentials supported by the issuer, you can use the `issuer.modules.openId4VcIssuer.updateIssuer` method.

## Creating a credential offer

Once you have configured the issuer, you can create a credential offer. The credential offer method will generate a credential offer URI that you can share with a holder.

```typescript showLineNumbers sd-jwt-vc-openid4vc.ts section-3

```

We have also added an event listener that listens for state changed events, this allows us to know when the issuance session is done.

## Implementing the credential mapper

The OpenID4VC Issuer Module setup didn't cover the implementation of the `credentialRequestToCredentialMapper` yet. When you create a credential offer with the OpenID4VC Issuer Module in Credo, you don't have to provide the credential data directly.

Instead, you provide a `credentialRequestToCredentialMapper` function in the agent configuration, that will be called when the holder requests the credential.

This allows you to dynamically generate the credential data based on the holder's request, and means you also don't have to store any credential data in the agent.

Below is an example `credentialRequestToCredentialMapper` function that generates a credential based on the holder's request. Make sure to register this function in the agent configuration `modules.openId4VcIssuer.endpoints.credential.credentialsRequestToCredentialMapper`.

```typescript showLineNumbers sd-jwt-vc-openid4vc.ts section-4

```
