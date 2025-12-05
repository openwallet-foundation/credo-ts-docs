# Receiving and Proving Credentials using the OpenID4VC Holder Module

This tutorial will guide you through the process of receiving and proving credentials using the OpenID4VC Holder Module. Before starting this tutorial, make sure you have completed the [OpenID4VC Holder Module Setup](/guides/getting-started/set-up/openid4vc.md).

This guides only covers the receiving and proving of credentials using the OpenID4VC Holder Module. Follow the [Issuing Credentials using the OpenID4VC Issuer Module](/guides/tutorials/openid4vc/issuing-credentials-using-openid4vc-issuer-module.md) and [Verifying Credentials using the OpenID4VC Verifier Module](/guides/tutorials/openid4vc/verifying-credentials-using-openid4vc-verifier-module.md) guides to learn how to issue and verify credentials using the OpenID4VC Issuer and Verifier Modules.

## Resolving and accepting a credential offer

Once you have set-up your agent (under `holder` variable), and have a credential offer (either created using the issuer module, or an external OpenID4VC issuer), we can resolve and accept the credential offer.

The `credentialBindingResolver` is a method you need to provide that configures how the credential should be bound to the wallet. The implemented binding resolver in this tutorial first checks if the issuer supports `did:key` and will use that. Otherwise it will check if jwk is supported.

```typescript showLineNumbers sd-jwt-vc-openid4vc.ts section-6

```

Finally the credentials are stored using the SD JWT VC and W3C modules. In a wallet application you could choose to first show the credential to the user before storing it in the wallet.

## Resolving and accepting an authorization request (presentation request)

Once you have a credential in your wallet, you can start presenting it based on a receive authorization request including an OpenID4VP presentation request (either created using the verifier module, or an external OpenID4VC verifier). First we resolve the authorization request, and then we accept it and present the credential in our wallet.

```typescript showLineNumbers sd-jwt-vc-openid4vc.ts section-9

```
