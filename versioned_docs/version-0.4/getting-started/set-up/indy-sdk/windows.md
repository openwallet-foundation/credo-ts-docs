# Windows

To install [Indy SDK](https://github.com/hyperledger/indy-sdk) on Windows, you can download the pre-built binary from the [Sovrin repository](https://repo.sovrin.org/windows/libindy/master/1.16.0-1636/libindy_1.16.0.zip).

Once downloaded, extract the zip into a **permanent location**.

Next, go to `environment variables` on your system and click on `new` at
`System Variables`. The name MUST be `LD_LIBRARY_PATH` and the value MUST be
the path to the extracted libraries.

### Confirm installation

To see whether the Indy SDK is correctly installed on your system, run the following command and it should not error.

```console
npx -p @aries-framework/node@^0.3 is-indy-installed
```
