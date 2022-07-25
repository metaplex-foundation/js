# NFT.Storage Plugin for the Metaplex JavaScript SDK

This plugin provides a storage driver for the Metaplex JavaScript SDK that uses NFT.Storage to upload assets.

## Installation

```sh
npm install @metaplex-foundation/js-plugin-nft-storage
```

## Usage

Once installed, you can use NFT.Storage as a Storage driver for the Metaplex JavaScript SDK like so:

```ts
import { nftStorage } from "@metaplex-foundation/js-plugin-nft-storage";
metaplex.use(nftStorage());
```

This will default to using a derived authentication token from the current identity of the SDK.

If you have an explicit authentication token you wish to use, you can pass it in like this:

```ts
import { nftStorage } from "@metaplex-foundation/js-plugin-nft-storage";
metaplex.use(nftStorage({ token: "my-nft-storage-token" }));
```

Additionally, the `nftStorage` plugins accepts the following options.

- `identity`: The identity to use for authentication when no explicit `token` is provided. Defaults to the current identity of the SDK (i.e. `metaplex.identity()`).
- `endpoint`: The endpoint to use for contacting NFT.Storage. Defaults to `https://api.nft.storage`.
- `gatewayHost`: The hostname of the NFT.Storage gateway to use. This enables us to use `https://` references instead of the traditional `ipfs://` protocol. Defaults to `https://nftstorage.link/`.
- `useGatewayUrls`: Whether to use the gateway hostname for asset URLs. Defaults to `true`.
- `batchSize`: The number of assets to upload in a single batch. If the number of assets goes above this number, multiple calls to NFT.Storage will be executed sequentially. Defaults to `50`.

## Upload listener

NFT.Storage also allows us to listen to upload progress by accepting an optional event listener that will be called whenever a chunk of data is uploaded. These chunks weight around 10MB each. Here's an example of how to listener to this event using the JS SDK.

```ts
import { toMetaplexFileFromBrowser, getBytesFromMetaplexFiles } from "@metaplex-foundation/js";
import { nftStorage, NftStorageDriver } from "@metaplex-foundation/js-plugin-nft-storage";
metaplex.use(nftStorage());

const file = await toMetaplexFileFromBrowser(browserFile);
const fileBytes = getBytesFromMetaplexFiles(file);
let bytesUploaded = 0;

const driver = metaplex.storage().driver() as NftStorageDriver;
driver.onProgress((size: number) => {
  bytesUploaded += size;
  console.log(`Uploaded ${bytesUploaded} bytes out of ${fileBytes} bytes`);
});

await metaplex.storage().upload(file);
```
