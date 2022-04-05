# Metaplex JavaScript SDK

```scala
⛔️ DO NOT USE IN PRODUCTION, THIS SDK IS IN VERY EARLY ALPHA STAGES!
```

This SDK helps developers get started with the on-chain tools provided by Metaplex. It focuses its API on common use-cases to provide a smooth developer experience whilst allowing third parties to extend its features via plugins.

Please note that this SDK has been re-implemented from scratch and is currently in alpha. This means some of the core API and interfaces might change from one version to another and therefore **we do not recommend that you use it in production** just yet.

However, feel free to play with it and provide some early feedback if you wish to contribute to the direction of this project.

## Installation
```sh
npm install @metaplex-foundation/js-next
```

## Setup
The entry point to the JavaScript SDK is a `Metaplex` instance that will give you access to its API.

It accepts a `Connection` instance that will be used to communicate with the cluster.

```ts
import { Metaplex } from "@metaplex/js-next";
import { Connection, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("mainnet-beta"));
const metaplex = new Metaplex(connection);
```

On top of that, you can customise who the SDK should interact on behalf of and which storage provider to use when uploading assets. We refer to these as "Identity Drivers" and "Storage Drivers" respectively. You may change these drivers by calling the `use` method on the Metaplex instance like so. We'll see all available drivers in more detail below.

```ts
import { Metaplex, keypairIdentity, bundlrStorage } from "@metaplex/js-next";
import { Connection, clusterApiUrl, Keypair } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("mainnet-beta"));
const wallet = Keypair.generate();

const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(wallet))
    .use(bundlrStorage());
```

Notice how you can create a `Metaplex` instance using `Metaplex.make(...)` instead of `new Metaplex(...)` in order to make the fluent API more readable.

## Usage
Once properly configured, that `Metaplex` instance can be used to access modules providing different sets of features. Currently, there is only one NFT module that can be accessed via the `nfts()` method. From that module, you will be able to find, create and update NFTs with more features to come.

Here is a little visual representation of the SDK in its current state.

![High-level architecture of the SDK.](https://user-images.githubusercontent.com/3642397/160883270-33fb4767-d3b1-4496-9f00-317bb1e18e68.png)

Now, let’s look into the NFT module in a bit more detail before moving on to the identity and storage drivers.

## NFTs
The NFT module can be accessed via `Metaplex.nfts()` and provide the following methods.

### findNft

The `findNft` method accepts a `mint` public key and returns [an `Nft` object](#the-nft-model).

```ts
const mint = new PublicKey("ATe3DymKZadrUoqAMn7HSpraxE4gB88uo1L9zLGmzJeL");

const nft = await metaplex.nfts().findNft({ mint });
```

Currently, you can only find an NFT via its mint address but more options will be added soon — e.g. by metadata PDA, by URI, etc. — hence the object parameter.

### createNft

The `createNft` method accepts [a whole bunch of parameters](/src/modules/nfts/actions/createNft.ts#L11) where most of them are optional as the SDK will do its best to provide sensible default values.

For instance, say you’ve already uploaded the JSON metadata somewhere, you can create a new NFT by simply providing that its URI like so:

```ts
const { nft } = await metaplex.nfts().createNft({
    uri: "https://arweave.net/I0SChzC7YKr8NNctCCSMWWmrHegvuH4sN_-c6LU51wQ",
});
```

This will take care of creating the mint account, the associated token account, the metadata PDA and the master edition PDA for you. It will even fetch the metadata it points to and try to use some of its fields to fill the gaps in the on-chain data. E.g. the metadata name will be used for the on-chain name as a fallback.

When no owner, mint authority or update authority are provided, the “identity” of the SDK will be used by default. It will also default to setting the identity as the first and only creator with a 100% share and will set the secondary sales royalties to 5%. You can, of course, customise any of these parameters by providing them explicitly.

[Here is the exhaustive list of parameters](/src/modules/nfts/actions/createNft.ts#L11) accepted by the `createNft` method.

### uploadMetadata

If your metadata is not already uploaded, you may do this using the SDK via the `uploadMetadata` method. This method accepts a metadata object where any `MetaplexFile`s inside this object will be uploaded to the current storage driver and replaced by their URI. The method also returns the URI of the uploaded JSON metadata so you can immediately use it in combination with the `createNft` method above.

```ts
const { uri, metadata } = await metaplex.nfts().uploadMetadata({
    name: "My NFT",
    image: new MetaplexFile(Buffer.from(...), 'nft-preview.jpg'),
    properties: {
        files: [
            {
                type: "video/mp4",
                uri: new MetaplexFile(Buffer.from(...), 'nft-animation.mp4'),
            },
        ]
    }
});

console.log(metadata.image) // https://arweave.net/123
console.log(metadata.properties.files[0].uri) // https://arweave.net/456
console.log(uri) // https://arweave.net/789
```

### updateNft

The `updateNft` method accepts an `Nft` object and a set of parameters to update on the NFT. It then returns a new `Nft` object representing the updated NFT.

For instance, here is how you would change the on-chain name of an NFT.

```ts
const { nft: updatedNft } = await metaplex.nfts().updateNft(nft, {
    name: "My Updated Name",
});
```

Anything that you don’t provide in the parameters will stay unchanged.

If you’d like to change the NFT metadata, you’d first need to upload a new JSON metadata and then update the NFT using its URI.

```ts
const { uri: newUri } = await metaplex.nfts().uploadMetadata({
    ...nft.metadata,
    name: "My Updated Metadata Name",
    description: "My Updated Metadata Description",
});

const { nft: updatedNft } = await metaplex.nfts().updateNft(nft, {
    uri: newUri,
});
```

Notice how we can use the storage driver for this. We’ll talk more about that below.

### The `Nft` model

All of the methods above either return or interact with an `Nft` object. The `Nft` object is a read-only data representation of your NFT that contains all the information you need at the top level — i.e. no more `metadata.data.data`.

You can see [its full data representation here](/src/modules/nfts/models/Nft.ts).

## Identity
The current identity of a `Metaplex` instance can be accessed via `metaplex.identity()` and provide information on the wallet we are acting on behalf of when interacting with the SDK.

This method returns an identity object with the following interface.

```ts
class IdentityDriver {
    publicKey: PublicKey;
    signMessage(message: Uint8Array): Promise<Uint8Array>;
    verifyMessage(message: Uint8Array, signature: Uint8Array): Promise<boolean>;
    signTransaction(transaction: Transaction): Promise<Transaction>;
    signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
    sendTransaction(transaction: Transaction, signers: Signer[], options?: SendOptions): Promise<TransactionSignature>;
    is(that: IdentityDriver): boolean;
}
```

The implementation of these methods depends on the concrete identity driver being used. For instance, in the CLI, these methods will directly use a key pair whereas, in the browser, they will delegate to a wallet adapter.

Let’s have a quick look at the concrete identity drivers available to us.

### guestIdentity

The `guestIdentity` driver is the default driver and requires no parameter. It is essentially a `null` driver that can be useful when we don’t need to send any signed transactions.

```ts
import { guestIdentity } from "@metaplex/js-next";

metaplex.use(guestIdentity());
```

If we try to sign a message or a transaction using this driver, an error will be thrown.

### keypairIdentity

The `keypairIdentity` driver accepts a `Keypair` object as a parameter. This is useful when using the SDK locally such as within CLI applications.

```ts
import { keypairIdentity } from "@metaplex/js-next";
import { Keypair } from "@solana/web3.js";

// Load a local keypair.
const keypairFile = fs.readFileSync('/Users/username/.config/solana/id.json');
const keypair = Keypair.fromSecretKey(Buffer.from(JSON.parse(keypairFile.toString())));

// Use it in the SDK.
metaplex.use(keypairIdentity(keypair));
```

### walletAdapterIdentity

The `walletAdapterIdentity` driver accepts a wallet adapter as defined by the [“wallet-adapter” repo from Solana Labs](https://github.com/solana-labs/wallet-adapter). This is useful when using the SDK in a web application that requires the user to manually approve transactions.

```ts
import { walletAdapterIdentity } from "@metaplex/js-next";
import { useWallet } from '@solana/wallet-adapter-react';

const { wallet } = useWallet();

if (wallet) {
    metaplex.use(walletAdapterIdentity(wallet));
}
```

Note that we have to wrap `metaplex.use(...)` in an if-statement because `wallet` could be `null` — meaning there’s no connected wallet at this time. If you’d like to accept a nullable wallet and use the `guestIdentity` when it is null, you may use the `walletOrGuestIdentity` helper method instead.

```ts
import { walletOrGuestIdentity } from "@metaplex/js-next";
import { useWallet } from '@solana/wallet-adapter-react';

const { wallet } = useWallet();

metaplex.use(walletOrGuestIdentity(wallet));
```

## Storage
You may access the current storage driver using `metaplex.storage()` which will give you access to the following interface.

```ts
class StorageDriver {
    getPrice(...files: MetaplexFile[]): Promise<SolAmount>;
    upload(file: MetaplexFile): Promise<string>;
    uploadAll(files: MetaplexFile[]): Promise<string[]> {
    uploadJson<T extends object>(json: T): Promise<string>;
    download(uri: string): Promise<MetaplexFile>;
    downloadJson<T extends object>(uri: string): Promise<T>;
}
```

The `MetaplexFile` class is a simple wrapper around `Buffer` that adds additional context relevant to files and assets such as their filename, content type, extension, etc. It contains the following data.

```ts
class MetaplexFile {
  public readonly buffer: Buffer;
  public readonly fileName: string;
  public readonly displayName: string;
  public readonly uniqueName: string;
  public readonly contentType: string | null;
  public readonly extension: string | null;
  public readonly tags: { name: string; value: string }[];
}
```

The implementation of these storage methods depends on the concrete storage driver being used. Let’s take a look at the storage drivers available to us.

### bundlrStorage

The `bundlrStorage` driver is the default driver and uploads assets on Arweave using the [Bundlr network](https://bundlr.network/).

By default, it will use the same RPC endpoint used by the `Metaplex` instance as a `providerUrl` and the mainnet address `"https://node1.bundlr.network"` as the Bundlr address.

You may customise these by passing a parameter object to the `bundlrStorage` method. For instance, here’s how you can use Bundlr on devnet.

```ts
import { bundlrStorage } from "@metaplex/js-next";

metaplex.use(bundlrStorage({
    address: 'https://devnet.bundlr.network',
    providerUrl: 'https://api.devnet.solana.com',
    timeout: 60000,
}));
```

### awsStorage

The `awsStorage` driver uploads assets off-chain to an S3 bucket of your choice.

To set this up, you need to pass in the AWS client as well as the bucket name you wish to use. For instance:

```ts
import { awsStorage } from "@metaplex/js-next";
import { S3Client } from "@aws-sdk/client-s3";

const awsClient = new S3Client({ region: 'us-east-1' });

metaplex.use(awsStorage(awsClient, 'my-nft-bucket'));
```

When uploading a `MetaplexFile` using `metaplex.storage().upload(file)`, the unique name of the file will be used as the AWS key. By default, this will be a random string generated by the SDK but you may explicitly provide your own like so.

```ts
const file = new MetaplexFile('file-content', 'filename.jpg', {
    uniqueName: 'my-unique-aws-key',
})

const uri = await metaplex.storage().upload(file);
```

### mockStorage

The `mockStorage` driver is a fake driver mostly used for testing purposes. It will not actually upload the assets anywhere but instead will generate random URLs and keep track of their content in a local dictionary. That way, once uploaded, an asset can be retrieved using the `download` method.

```ts
import { mockStorage } from "@metaplex/js-next";

metaplex.use(mockStorage());
```

## Next steps
As mentioned above, this is SDK is still in very early stages. We plan to add a lot more features to it. Here’s a quick overview of what we plan to work on next.
- New features in the NFT module.
- New modules such as a NFT Collections module, a Candy Machine module, an Action House module, etc.
- More storage drivers.
- More identity drivers.
- New types of drivers such as error handling, logging, etc.
- Extracting some of the SDK logic to external libraries for developers to reuse them in their own projects.
- Adding more services and abstractions in order to encapsulate some of the quirky behaviour of the cluster and improve the user experience.
- More documentation, tutorials, starter kits, etc.

Stay tuned. 🔥
