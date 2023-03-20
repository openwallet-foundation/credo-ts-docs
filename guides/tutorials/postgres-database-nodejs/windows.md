# Postgres Setup for windows

## Build Environment Prerequisites

1. Download and install Visual Studio Community Edition 2022
1. Install git for windows
1. Download rust for windows [here](https://www.rust-lang.org/en-US/install.html)
1. Make sure you have already setup alibindy for windows from [here](../../getting-started/indy-sdk/windows)

## Step 1: Getting dependencies

- Download the prebuilt dependencies [here](https://repo.sovrin.org/windows/libindy/deps/)
- Extract them
- Point path to this directory using environment variables:
  - `set INDY_PREBUILT_DEPS_DIR=C:\Users\{WINDOWS_USER}\Downloads\indy-sdk-deps`
  - `set INDY_CRYPTO_PREBUILT_DEPS_DIR=C:\Users\{WINDOWS_USER}\Downloads\indy-sdk-deps`
  - `set MILAGRO_DIR=C:\Users\{WINDOWS_USER}\Downloads\indy-sdk-deps`
  - `set LIBZMQ_PREFIX=C:\Users\{WINDOWS_USER}\Downloads\indy-sdk-deps`
  - `set SODIUM_LIB_DIR=C:\Users\{WINDOWS_USER}\Downloads\indy-sdk-deps`
  - `set OPENSSL_DIR=C:\Users\{WINDOWS_USER}\Downloads\indy-sdk-deps`
  - `set PATH=C:\Users\{WINDOWS_USER}\Downloads\indy-sdk-deps\lib`

## Step 2: Build postgres plugin

Building postgres plugin from the indy sdk repo with cargo.

### Step 2.1: Cloning the indy-sdk

```sh
git clone https://github.com/hyperledger/indy-sdk.git

cd indy-sdk\experimental\plugins\postgres_storage
```

### Step 2.2: Building postgres plugin

If this step throws any errors, it might be because of the environment. Step 1 of this guide provided the dependencies that are required.

```sh
cargo build --release --target x86_64-pc-windows-msvc
```

The library **indystrgpostgres.dll** file will be located at `indy-sdk\experimental\plugins\postgres_storage\target\x86_64-pc-windows-msvc\release`

### Step 2.3: Setting the file to PATH

- `set LIB_INDY_STRG_POSTGRES=C:\Users\{WINDOWS_USER}\Downloads\indy-sdklexperimental\plugins\postgres_storage\target\x86_64-pc-windows-msvc\release`

or Alternatively you can copy the **indystrgpostgres.dll** file to `c:\\windows\\system32\\`
