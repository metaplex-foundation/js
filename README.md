# Metaplex JavaScript SDK

This SDK helps developers get started with the on-chain tools provided by Metaplex. It focuses its API on common use-cases to provide a smooth developer experience whilst allowing third parties to extend its features via plugins.

⚠️ [Stability 1 - Experimental](https://docs.metaplex.com/stability). Please note that this SDK has been re-implemented from scratch and is still in active development. This means **some of the core API and interfaces might change from one version to another**. However, feel free to use it and provide some early feedback if you wish to contribute to the direction of this project.

## Installation
```sh
npm install @metaplex-foundation/js @solana/web3.js
```

🔥 **Pro Tip**: Check out our examples and starter kits on the ["JS Examples" repository](https://github.com/metaplex-foundation/js-examples).

## Setup
The entry point to the JavaScript SDK is a `Metaplex` instance that will give you access to its API.

It accepts a `Connection` instance that will be used to communicate with the cluster.

```ts
import { Metaplex } from "@metaplex-foundation/js";
import { Connection, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("mainnet-beta"));
const metaplex = new Metaplex(connection);
```

On top of that, you can customise who the SDK should interact on behalf of and which storage provider to use when uploading assets. We refer to these as "Identity Drivers" and "Storage Drivers" respectively. You may change these drivers by calling the `use` method on the Metaplex instance like so. We'll see all available drivers in more detail below.

```ts
import { Metaplex, keypairIdentity, bundlrStorage } from "@metaplex-foundation/js";
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

![High-level architecture of the SDK.](https://user-images.githubusercontent.com/3642397/167716670-16c6ec5e-76ba-4c15-9dfc-7790d90099dd.png)

Now, let’s look into the NFT module in a bit more detail before moving on to the identity and storage drivers.

## NFTs
The NFT module can be accessed via `metaplex.nfts()` and provide the following methods.

- [`findByMint(mint)`](#findByMint)
- [`findAllByMintList(mints)`](#findAllByMintList)
- [`findAllByOwner(owner)`](#findAllByOwner)
- [`findAllByCreator(creator, position = 1)`](#findAllByCreator)
- [`findAllByCandyMachine(candyMachine, version = 2)`](#findAllByCandyMachine)
- [`uploadMetadata(metadata)`](#uploadMetadata)
- [`create(onChainData)`](#create)
- [`update(nft, onChainData)`](#update)
- [`printNewEdition(originalMint, params)`](#printNewEdition)

And the following model, either returned or used by the above methods.

- [The `Nft` model](#the-nft-model)

### findByMint

The `findByMint` method accepts a `mint` public key and returns [an `Nft` object](#the-nft-model).

```ts
const mint = new PublicKey("ATe3DymKZadrUoqAMn7HSpraxE4gB88uo1L9zLGmzJeL");

const nft = await metaplex.nfts().findByMint(mint);
```

The returned `Nft` object will have its JSON metadata already loaded so you can, for instance, access its image URL like so (provided it is present in the downloaded metadata).

```ts
const imageUrl = nft.metadata.image;
```

Similarly, the `OriginalEdition` account (a.k.a the Master Edition) of the NFT will also be already loaded and, if it exists on that NFT, you can use it like so.

```ts
const supply = nft.originalEdition.supply;
const maxSupply = nft.originalEdition.maxSupply;
```

You can [read more about the `NFT` model below](#the-nft-model).

### findAllByMintList

The `findAllByMintList` method accepts an array of mint addresses and returns an array of `Nft`s. However, `null` values will be returned for each provided mint address that is not associated with an NFT.

Note that this is much more efficient than calling `findByMint` for each mint in the list as the SDK can optimise the query and fetch multiple NFTs in much fewer requests.

```ts
const [nftA, nftB] = await metaplex.nfts().findAllByMintList([mintA, mintB]);
```

NFTs retrieved via `findAllByMintList` will not have their JSON metadata loaded because this would require one request per NFT and could be inefficient if you provide a long list of mint addresses. Additionally, you might want to fetch these on-demand, as the NFTs are being displayed on your web app for instance. The same goes for the `Edition` account which might be irrelevant until the user clicks on the NFT.

Thus, if you want to load the JSON metadata and/or the `Edition` account of an NFT, you may do this like so.

```ts
await nft.metadataTask.run();
await nft.EditionTask.run();
```

This will give you access to the `metadata`, `originalEdition` and `printEdition` properties of the NFT. The last two depend on whether the NFT is an original edition or a print edition.

```ts
const imageUrl = nft.metadata.image;

if (nft.isOriginal()) {
    const currentSupply = nft.originalEdition.supply;
    const maxSupply = nft.originalEdition.maxSupply;
}

if (nft.isPrint()) {
  const parentEdition = nft.printEdition.parent;
  const editionNumber = nft.printEdition.edition;
}
```

We'll talk more about these tasks when documenting [the `NFT` model](#the-nft-model).

### findAllByOwner

The `findAllByOwner` method accepts a public key and returns all `Nft`s owned by that public key.

```ts
const myNfts = await metaplex.nfts().findAllByOwner(metaplex.identity().publicKey);
```

Similarly to `findAllByMintList`, the returned `Nft`s will not have their JSON metadata nor their edition account loaded.

### findAllByCreator

The `findAllByCreator` method accepts a public key and returns all `Nft`s that have that public key registered as their first creator. Additionally, you may provide an optional position parameter to match the public key at a specific position in the creator list.

```ts
const nfts = await metaplex.nfts().findAllByCreator(creatorPublicKey);
const nfts = await metaplex.nfts().findAllByCreator(creatorPublicKey, 1); // Equivalent to the previous line.
const nfts = await metaplex.nfts().findAllByCreator(creatorPublicKey, 2); // Now matching the second creator field.
```

Similarly to `findAllByMintList`, the returned `Nft`s will not have their JSON metadata nor their edition account loaded.

### findAllByCandyMachine

The `findAllByCandyMachine` method accepts the public key of a Candy Machine and returns all `Nft`s that have been minted from that Candy Machine so far.

By default, it will assume you're providing the public key of a Candy Machine v2. If you want to use a different version, you can provide the version as the second parameter.

```ts
const nfts = await metaplex.nfts().findAllByCandyMachine(candyMachinePublicKey);
const nfts = await metaplex.nfts().findAllByCandyMachine(candyMachinePublicKey, 2); // Equivalent to the previous line.
const nfts = await metaplex.nfts().findAllByCandyMachine(candyMachinePublicKey, 1); // Now finding NFTs for Candy Machine v1.
```

Note that the current implementation of this method delegates to `findAllByCreator` whilst fetching the appropriate PDA for Candy Machines v2.

Similarly to `findAllByMintList`, the returned `Nft`s will not have their JSON metadata nor their edition account loaded.

### uploadMetadata

When creating or updating an NFT, you will need a URI pointing to some JSON Metadata describing the NFT. Depending on your requirement, you may do this on-chain or off-chain.

If your metadata is not already uploaded, you may do this using the SDK via the `uploadMetadata` method. It accepts a metadata object and returns the URI of the uploaded metadata. Where exactly the metadata will be uploaded depends on the selected `StorageDriver`.

```ts
const { uri } = await metaplex.nfts().uploadMetadata({
    name: "My NFT",
    description: "My description",
    image: "https://arweave.net/123",
});

console.log(uri) // https://arweave.net/789
```

Some properties inside that metadata object will also require you to upload some assets to provide their URI — such as the `image` property on the example above.

To make this process easier, the `uploadMetadata` method will recognise any instances of `MetaplexFile` within the provided object and upload them in bulk to the current storage driver. It will then create a new version of the provided metadata where all instances of `MetaplexFile` are replaced with their URI. Finally, it will upload that replaced metadata to the storage driver and return it.

```ts
// Assuming the user uploaded two images via an input of type "file".
const browserFiles = event.target.files;

const { uri, metadata } = await metaplex.nfts().uploadMetadata({
    name: "My NFT",
    image: await useMetaplexFileFromBrowser(browserFiles[0]),
    properties: {
        files: [
            {
                type: "video/mp4",
                uri: await useMetaplexFileFromBrowser(browserFiles[1]),
            },
        ]
    }
});

console.log(metadata.image) // https://arweave.net/123
console.log(metadata.properties.files[0].uri) // https://arweave.net/456
console.log(uri) // https://arweave.net/789
```

Note that `MetaplexFile`s can be created in various different ways based on where the file is coming from. You can [read more about `MetaplexFile` objects and how to use them here](#MetaplexFile).

### create

The `create` method accepts [a variety of parameters](/src/plugins/nftModule/createNft.ts) that define the on-chain data of the NFT. The only required parameter is the `uri` pointing to its JSON metadata — remember that you can use `uploadMetadata` to get that URI. All other parameters are optional as the SDK will do its best to provide sensible default values.

Here's how you can create a new NFT with minimum configuration.

```ts
const { nft } = await metaplex.nfts().create({
    uri: "https://arweave.net/123",
});
```

This will take care of creating the mint account, the associated token account, the metadata PDA and the original edition PDA (a.k.a. the master edition) for you.

Additionally, since no other optional parameters were provided, it will do its best to provide sensible default values for the rest of the parameters. Namely:
- It will fetch the JSON metadata from the provided URI and try to use some of its fields to fill the gaps in the on-chain data. E.g. the metadata name will be used for the on-chain name as a fallback.
- Since no owner, mint authority or update authority were provided, the “identity” of the SDK will be used by default for these parameters. Meaning the SDK's identity will be the owner of that new NFT.
- It will also default to setting the identity as the first and only creator with a 100% share.
- It will try to fetch the secondary sales royalties from the downloaded JSON metadata or will default to 5%.
- It will default to making the NFT immutable — meaning you won't be able to update it later on.

If some of these default parameters are not suitable for your use case, you may provide them explicitly when creating the NFT. [Here is the exhaustive list of parameters](/src/plugins/nftModule/createNft.ts) accepted by the `create` method.

### update

The `update` method accepts an `Nft` object and a set of parameters to update on the NFT. It then returns a new `Nft` object representing the updated NFT.

For instance, here is how you would change the on-chain name of an NFT.

```ts
const { nft: updatedNft } = await metaplex.nfts().update(nft, {
    name: "My Updated Name",
});
```

Anything that you don’t provide in the parameters will stay unchanged.

If you’d like to change the JSON metadata of the NFT, you’d first need to upload a new metadata object using the `uploadMetadata` method and then use the provided URI to update the NFT.

```ts
const { uri: newUri } = await metaplex.nfts().uploadMetadata({
    ...nft.metadata,
    name: "My Updated Metadata Name",
    description: "My Updated Metadata Description",
});

const { nft: updatedNft } = await metaplex.nfts().update(nft, {
    uri: newUri,
});
```

### printNewEdition

The `printNewEdition` method requires the mint address of the original NFT and returns a brand-new NFT printed from the original edition.

For instance, this is how you would print a new edition of the `originalNft` NFT.

```ts
const { nft: printedNft } = await metaplex.nfts().printNewEdition(originalNft.mint);
```

By default, it will print using the token account of the original NFT as proof of ownership, and it will do so using the current `identity` of the SDK. You may customise all of these parameters by providing them explicitly.

```ts
const { nft: printedNft } = await metaplex.nfts().printNewEdition(originalMint, {
  newMint,                   // Defaults to a brand-new Keypair.
  newMintAuthority,          // Defaults to the current identity.
  newUpdateAuthority,        // Defaults to the current identity.
  newOwner,                  // Defaults to the current identity.
  newFreezeAuthority,        // Defaults to undefined.
  payer,                     // Defaults to the current identity.
  originalTokenAccountOwner, // Defaults to the current identity.
  originalTokenAccount,      // Defaults to the ATA of the current identity.
});
```

### The `Nft` model

All of the methods above either return or interact with an `Nft` object. The `Nft` object is a read-only data representation of your NFT that contains all the information you need at the top level — i.e. no more `metadata.data.data`.

You can see [its full data representation by checking the code](/src/plugins/nftModule/Nft.ts) but here is an overview of the properties that are available on the `Nft` object.

```ts
// Always loaded.
updateAuthority: PublicKey;
mint: PublicKey;
name: string;
symbol: string;
uri: string;
sellerFeeBasisPoints: number;
creators: Creator[] | null;
primarySaleHappened: boolean;
isMutable: boolean;
editionNonce: number | null;
tokenStandard: TokenStandard | null;
collection: Collection | null;
uses: Uses | null;

// Sometimes loaded.
metadata: JsonMetadata | null;
editionAccount: OriginalOrPrintEditionAccount | null;
originalEdition: null | {
    supply: number | BN;
    maxSupply: number | BN;
};
printEdition: null | {
  parent: PublicKey;
  edition: number | BN;
};
```

As you can see, some of the properties — such as `metadata` — are loaded on demand. This is because they are not always needed and/or can be expensive to load. Therefore, the SDK uses the following rule of thumb:
- If you're only fetching one NFT — e.g. by using `findByMint` — then these properties will already be loaded.
- If you're fetching multiple NFTs — e.g. by using `findAllByMintLint` — then these properties will not be loaded and you will need to load them as and when you need them.

In order to load these properties, you may run the `metadataTask` and `editionTask` properties of the `Nft` object.

```ts
await nft.metadataTask.run();
await nft.editionTask.run();
```

After these two promises resolve, you should have access to the `metadata`, `editionAccount`, `originalEdition` and `printEdition` properties. Note that if a task fails to load the data, an error will be thrown.

Also, note that both `metadataTask` and `editionTask` are of type `Task` which contains a bunch of helper methods. Here's an overview of the methods available in the `Task` class:

```ts
class Task<T> = {
    getStatus: () => TaskStatus;
    getResult: () => T | undefined;
    getError: () => unknown;
    isPending: () => boolean;
    isRunning: () => boolean;
    isCompleted: () => boolean;
    isSuccessful: () => boolean;
    isFailed: () => boolean;
    isCanceled: () => boolean;
    run: (options?: TaskOptions) => Promise<T>;
    loadWith: (preloadedResult: T) => Task<T>;
    reset: () => Task<T>;
    onStatusChange: (callback: (status: TaskStatus) => unknown) => Task<T>;
    onStatusChangeTo: (status: TaskStatus, callback: () => unknown) => Task<T>;
    onSuccess: (callback: () => unknown) => Task<T>;
    onFailure: (callback: () => unknown) => Task<T>;
    onCancel: (callback: () => unknown) => Task<T>;
    setChildren: (children: Task<any>[]) => Task<T>;
    getChildren: () => Task<any>[];
    getDescendants: () => Task<any>[];
    setContext: (context: object) => Task<T>;
    getContext: () => object;
};

export type TaskOptions = {
    signal?: AbortSignal;
    force?: boolean;
};
```

As you can see, you get a bunch of methods to check the status of a task, listen to its changes, run it and reset its data. You also get a `loadWith` method which allows you to bypass the task and load the provided data directly — this can be useful when loading NFTs in batch.

You may also provide an `AbortSignal` using the `signal` property of the `TaskOptions` when running a task, allowing you to cancel the task if you need to. This needs to be supported by the concrete implementation of the task as they will have to consistently check that the task was not cancelled and return early if it was. The `force` property of `TaskOptions` can be used to force the task to run even if the task was already completed.

Tasks can also contain nested Tasks to keep track of the progress of a more complex operation if needed. You may use the `setChildren` and `getChildren` methods to add and retrieve nested tasks. The `getDescendants` method returns all the children of the task recursively.

Finally, you can set a context for the task using the `setContext` and `getContext` methods. This is useful for passing any custom data to a task such as a "name" and a "description" that can be used by the UI.

## Identity
The current identity of a `Metaplex` instance can be accessed via `metaplex.identity()` and provide information on the wallet we are acting on behalf of when interacting with the SDK.

This method returns an identity client with the following interface.

```ts
class IdentityClient {
    driver(): IdentityDriver;
    setDriver(newDriver: IdentityDriver): void;
    publicKey: PublicKey;
    secretKey?: Uint8Array;
    signMessage(message: Uint8Array): Promise<Uint8Array>;
    verifyMessage(message: Uint8Array, signature: Uint8Array): boolean;
    signTransaction(transaction: Transaction): Promise<Transaction>;
    signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
    equals(that: Signer | PublicKey): boolean;
    hasSecretKey(): this is KeypairSigner;
}
```

The `IdentityClient` delegates to whichever `IdentityDriver` is currently set to provide this set of methods. Thus, the implementation of these methods depends on the concrete identity driver being used. For instance, in the CLI, these methods will directly use a key pair whereas, in the browser, they will delegate to a wallet adapter.

Let’s have a quick look at the concrete identity drivers available to us.

### guestIdentity

The `guestIdentity` driver is the default driver and requires no parameter. It is essentially a `null` driver that can be useful when we don’t need to send any signed transactions.

```ts
import { guestIdentity } from "@metaplex-foundation/js";

metaplex.use(guestIdentity());
```

If we try to sign a message or a transaction using this driver, an error will be thrown.

### keypairIdentity

The `keypairIdentity` driver accepts a `Keypair` object as a parameter. This is useful when using the SDK locally such as within CLI applications.

```ts
import { keypairIdentity } from "@metaplex-foundation/js";
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
import { walletAdapterIdentity } from "@metaplex-foundation/js";
import { useWallet } from '@solana/wallet-adapter-react';

const { wallet } = useWallet();

if (wallet) {
    metaplex.use(walletAdapterIdentity(wallet));
}
```

Note that we have to wrap `metaplex.use(...)` in an if-statement because `wallet` could be `null` — meaning there’s no connected wallet at this time. If you’d like to accept a nullable wallet and use the `guestIdentity` when it is null, you may use the `walletOrGuestIdentity` helper method instead.

```ts
import { walletOrGuestIdentity } from "@metaplex-foundation/js";
import { useWallet } from '@solana/wallet-adapter-react';

const { wallet } = useWallet();

metaplex.use(walletOrGuestIdentity(wallet));
```

## Storage
You may access the storage client using `metaplex.storage()` which will give you access to the following interface.

```ts
class StorageClient {
    driver(): StorageDriver
    setDriver(newDriver: StorageDriver): void;
    getUploadPriceForBytes(bytes: number): Promise<Amount>;
    getUploadPriceForFile(file: MetaplexFile): Promise<Amount>;
    getUploadPriceForFiles(files: MetaplexFile[]): Promise<Amount>;
    upload(file: MetaplexFile): Promise<string>;
    uploadAll(files: MetaplexFile[]): Promise<string[]>;
    uploadJson<T extends object = object>(json: T): Promise<string>;
    download(uri: string, options?: RequestInit): Promise<MetaplexFile>;
    downloadJson<T extends object = object>(uri: string, options?: RequestInit): Promise<T>;
}
```

Similarly to the `IdentityClient`, the `StorageClient` delegates to the current `StorageDriver` when executing these methods. We'll take a look at the storage drivers available to us, but first, let's talk about the `MetaplexFile` class which is being used throughout the StorageClient API.

### MetaplexFile

The `MetaplexFile` type is a simple wrapper around `Buffer` that adds additional context relevant to files and assets such as their filename, content type, extension, etc. It contains the following data.

```ts
type MetaplexFile {
    readonly buffer: Buffer;
    readonly fileName: string;
    readonly displayName: string;
    readonly uniqueName: string;
    readonly contentType: string | null;
    readonly extension: string | null;
    readonly tags: { name: string; value: string }[];
}
```

You may use the `useMetaplexFile` function to create a `MetaplexFile` object from a `Buffer` instance (or content `string`) and a filename. The filename is necessary to infer the extension and the mime type of the provided file.

```ts
const file = useMetaplexFile('The content of my file', 'my-file.txt');
```

You may also explicitly provide these options by passing a third parameter to the constructor.

```ts
const file = useMetaplexFile('The content of my file', 'my-file.txt', {
    displayName = 'A Nice Title For My File'; // Defaults to the filename.
    uniqueName = 'my-company/files/some-identifier'; // Defaults to a random string.
    contentType = 'text/plain'; // Infer it from filename by default.
    extension = 'txt'; // Infer it from filename by default.
    tags = [{ name: 'my-tag', value: 'some-value' }]; // Defaults to [].
});
```

Note that if you want to create a `MetaplexFile` directly from a JSON object, there's a `useMetaplexFileFromJson` helper method that you can use like so.

```ts
const file = MetaplexFile.fromJson({ foo: 42 });
```

In practice, you will most likely be creating `MetaplexFile`s from files either present on your computer or uploaded by some user on the browser. You can do the former by using `fs.readFileSync`.

```ts
const buffer = fs.readFileSync('/path/to/my-file.txt');
const file = useMetaplexFile(buffer, 'my-file.txt');
```

And the latter by using the `useMetaplexFileFromBrowser` helper method which accepts a `File` object as defined in the browser.

```ts
const browserFile: File = event.target.files[0];
const file: MetaplexFile = await useMetaplexFileFromBrowser(browserFile);
```

Okay, now let’s talk about the concrete storage drivers available to us and how to set them up.

### bundlrStorage

The `bundlrStorage` driver is the default driver and uploads assets on Arweave using the [Bundlr network](https://bundlr.network/).

By default, it will use the same RPC endpoint used by the `Metaplex` instance as a `providerUrl` and the mainnet address `"https://node1.bundlr.network"` as the Bundlr address.

You may customise these by passing a parameter object to the `bundlrStorage` method. For instance, here’s how you can use Bundlr on devnet.

```ts
import { bundlrStorage } from "@metaplex-foundation/js";

metaplex.use(bundlrStorage({
    address: 'https://devnet.bundlr.network',
    providerUrl: 'https://api.devnet.solana.com',
    timeout: 60000,
}));
```

To fund your bundlr storage account you can cast it in TypeScript like so:

```ts
const bundlrStorage = metaplex.storage().driver() as BundlrStorageDriver;
```

This gives you access to useful public methods such as:

```ts
bundlrStorage.fund([metaplexFile1, metaplexFile2]); // Fund using file size.
bundlrStorage.fund(1000); // Fund using byte size.
(await bundlrStorage.bundlr()).fund(1000); // Fund using lamports directly.
```


### awsStorage

The `awsStorage` driver uploads assets off-chain to an S3 bucket of your choice.

To set this up, you need to pass in the AWS client as well as the bucket name you wish to use. For instance:

```ts
import { awsStorage } from "@metaplex-foundation/js";
import { S3Client } from "@aws-sdk/client-s3";

const awsClient = new S3Client({ region: 'us-east-1' });

metaplex.use(awsStorage(awsClient, 'my-nft-bucket'));
```

When uploading a `MetaplexFile` using `metaplex.storage().upload(file)`, the unique name of the file will be used as the AWS key. By default, this will be a random string generated by the SDK but you may explicitly provide your own like so.

```ts
const file = useMetaplexFile('file-content', 'filename.jpg', {
    uniqueName: 'my-unique-aws-key',
})

const uri = await metaplex.storage().upload(file);
```

### mockStorage

The `mockStorage` driver is a fake driver mostly used for testing purposes. It will not actually upload the assets anywhere but instead will generate random URLs and keep track of their content in a local dictionary. That way, once uploaded, an asset can be retrieved using the `download` method.

```ts
import { mockStorage } from "@metaplex-foundation/js";

metaplex.use(mockStorage());
```
