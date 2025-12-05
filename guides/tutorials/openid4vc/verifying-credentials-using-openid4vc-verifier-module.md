# Verifying Credentials using the OpenID4VC Verifier Module

This tutorial will guide you through the process of verifying credentials using the OpenID4VC Verifier Module. Before starting this tutorial, make sure you have completed the [OpenID4VC Verifier Module Setup](/guides/getting-started/set-up/openid4vc.md).

This guides only covers the verification of credentials using the OpenID4VC Verifier Module. Follow the [Issuing Credentials using the OpenID4VC Issuer Module](/guides/tutorials/openid4vc/issuing-credentials-using-openid4vc-issuer-module.md) and [Receiving and Proving Credentials using the OpenID4VC Holder Module](/guides/tutorials/openid4vc/receiving-and-proving-credentials-using-openid4vc-holder-module.md) guide to learn how to issuer, receive and prove credentials using the OpenID4VC Issuer and Holder Modules.

## Creating the verifier

Once you have set-up your agent (under `verifier` variable), we first need to configure your verifier.

```typescript showLineNumbers sd-jwt-vc-openid4vc.ts section-7

```

## Creating an authorization request

Once you have configured the verifier, you can create an authorization request including an OpenID4VP presentation request based on [DIF Presentation Exchange V2](https://identity.foundation/presentation-exchange/spec/v2.0.0/). The authorization request method will generate an authorization request URI that you can share with a holder.

```typescript showLineNumbers sd-jwt-vc-openid4vc.ts section-8

```

We have also added an event listener that listens for state changed events, this allows us to know when the verification session is done.
