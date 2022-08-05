# Metaplex JavaScript SDK

This SDK helps developers get started with the on-chain tools provided by Metaplex. It focuses its API on common use-cases to provide a smooth developer experience whilst allowing third parties to extend its features via plugins.

Please note that this SDK has been re-implemented from scratch and is still in active development. This means **some of the core API and interfaces might change from one version to another**. However, feel free to use it and provide some early feedback if you wish to contribute to the direction of this project.

## Installation
```sh
npm install @metaplex-foundation/js @solana/web3.js
```

🔥 **Pro Tip**: Check out our examples and starter kits on the ["JS Examples" repository](https://github.com/metaplex-foundation/js-examples).

## Setup
The entry point to the JavaScript SDK is a `Metaplex` instance that will give you access to its API.

It accepts a `Connection` instance from `@solana/web3.js` that will be used to communicate with the cluster.

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
Once properly configured, that `Metaplex` instance can be used to access modules providing different sets of features. Currently, there is only one (documented) NFT module that can be accessed via the `nfts()` method. From that module, you will be able to find, create and update NFTs with more features to come.

Every method that you call on the SDK will return an instance of type `Task<T>` where `T` is the return value you can expect when running the task. For instance, say you want to fetch an NFT via its mint address, you can access the `Task<Nft>` and run it like so:

```ts
const task = metaplex.nfts().findByMint(mintAddress);
const nft = await task.run();

// Or for short:
const nft = await metaplex.nfts().findByMint(mintAddress).run();
```

There are several advantages in consistently wrapping these operations into tasks. For instance, you can use the `task` instance to keep track of its progress _and_ you can cancel the task using an `AbortSignal` (similarly to how you cancel an HTTP request).

```ts
// Access the task that fetches the NFT.
const task = metaplex.nfts().findByMint(mintAddress);

// Listen to status changes an log them in the console.
task.onStatusChange((status: TaskStatus) => console.log(status));

// Create an AbortController that aborts in 100ms.
const abortController = new AbortController();
setTimeout(() => abortController.abort(), 100);

// Run the task using the AbortController's signal.
const nft = await task.run({ signal: abortController.signal });
```

We'll talk more about tasks and what you can do with them [in a later section](#tasks).

Now, let’s look into the NFT module in a bit more detail before moving on to the identity and storage drivers.

## NFTs
The NFT module can be accessed via `metaplex.nfts()` and provides the following methods.

- [`findByMint(mint, options)`](#findByMint)
- [`findAllByMintList(mints, options)`](#findAllByMintList)
- [`load(metadata, options)`](#load)
- [`findAllByOwner(owner, options)`](#findAllByOwner)
- [`findAllByCreator(creator, options)`](#findAllByCreator)
- [`uploadMetadata(metadata)`](#uploadMetadata)
- [`create(input)`](#create)
- [`update(nft, input)`](#update)
- [`printNewEdition(originalMint, input)`](#printNewEdition)
- [`use(nft, input)`](#useNft)

And the following model, either returned or used by the above methods.

- [The `Nft` model](#the-nft-model)

### findByMint

The `findByMint` method accepts a `mint` public key and returns [an `Nft` object](#the-nft-model).

```ts
const mint = new PublicKey("ATe3DymKZadrUoqAMn7HSpraxE4gB88uo1L9zLGmzJeL");

const nft = await metaplex.nfts().findByMint(mint).run();
```

The returned `Nft` object will have its JSON metadata already loaded so you can, for instance, access its image URL like so (provided it is present in the downloaded metadata).

```ts
const imageUrl = nft.json.image;
```

Similarly, the `Edition` information of the NFT — original or printed — is also available on the object via the `edition` property. Its type depends on whether the NFT is the original or a printed edition.

```ts
const editionAddress = nft.edition.address;

if (nft.edition.isOriginal) {
    const totalPrintedNfts = nft.edition.supply;
    const maxNftsThatCanBePrinted = nft.edition.maxSupply;
} else {
    const mintAddressOfOriginalNft = nft.edition.parent;
    const editionNumber = nft.edition.number;
}
```

You can [read more about the `NFT` model below](#the-nft-model).

### findAllByMintList

The `findAllByMintList` operation accepts an array of mint addresses and returns an array of NFTs. However, `null` values will be returned for each provided mint address that is not associated with an NFT.

Note that this is much more efficient than calling `findByMint` for each mint in the list as the SDK can optimise the query and fetch multiple NFTs in much fewer requests.

```ts
const [nftA, nftB] = await metaplex
    .nfts()
    .findAllByMintList([mintA, mintB])
    .run();
```

NFTs retrieved via `findAllByMintList` may be of type `Metadata` rather than `Nft`.

What this means is they won't have their JSON metadata loaded because this would require one request per NFT and could be inefficient if you provide a long list of mint addresses. Additionally, you might want to fetch these on-demand, as the NFTs are being displayed on your web app for instance. The same goes for the `edition` property which requires an extra account to fetch and might be irrelevant until the user clicks on the NFT.

Note that, since plugins can swap operation handlers with their own implementations, it is possible that a plugin relying on indexers return an array of `Nft`s directly instead of `Metadata`s. The default implementation though, will return `Metadata`s.

Thus, if you want to load the `json` and/or `edition` properties of an NFT, you need to load that `Metadata` into an `Nft`. Which you can do with the next operation.

### load

For performance reasons, when fetching NFTs in bulk, you may received `Metadata`s which exclude the JSON Metadata and the Edition information of the NFT. In order to transform a `Metadata` into an `Nft`, you may use the `load` operation like so.

```ts
const nft = await metaplex.nfts().load(metadata).run();
```

This will give you access to the `json` and `edition` properties of the NFT as explained in [the NFT model documentation](#the-nft-model).

### findAllByOwner

The `findAllByOwner` method accepts a public key and returns all NFTs owned by that public key.

```ts
const myNfts = await metaplex
    .nfts()
    .findAllByOwner(metaplex.identity().publicKey)
    .run();
```

Similarly to `findAllByMintList`, the returned NFTs may be `Metadata`s.

### findAllByCreator

The `findAllByCreator` method accepts a public key and returns all NFTs that have that public key registered as their first creator. Additionally, you may provide an optional position parameter to match the public key at a specific position in the creator list.

```ts
const nfts = await metaplex.nfts().findAllByCreator(creatorPublicKey).run();
const nfts = await metaplex.nfts().findAllByCreator(creatorPublicKey, { position: 1 }).run(); // Equivalent to the previous line.
const nfts = await metaplex.nfts().findAllByCreator(creatorPublicKey, { position: 2 }).run(); // Now matching the second creator field.
```

Similarly to `findAllByMintList`, the returned NFTs may be `Metadata`s.

### uploadMetadata

When creating or updating an NFT, you will need a URI pointing to some JSON Metadata describing the NFT. Depending on your requirement, you may do this on-chain or off-chain.

If your JSON metadata is not already uploaded, you may do this using the SDK via the `uploadMetadata` method. It accepts a metadata object and returns the URI of the uploaded metadata. Where exactly the metadata will be uploaded depends on the selected `StorageDriver`.

```ts
const { uri } = await metaplex
    .nfts()
    .uploadMetadata({
        name: "My NFT",
        description: "My description",
        image: "https://arweave.net/123",
    })
    .run();

console.log(uri) // https://arweave.net/789
```

Some properties inside that metadata object will also require you to upload some assets to provide their URI — such as the `image` property on the example above.

To make this process easier, the `uploadMetadata` method will recognise any instances of `MetaplexFile` within the provided object and upload them in bulk to the current storage driver. It will then create a new version of the provided metadata where all instances of `MetaplexFile` are replaced with their URI. Finally, it will upload that replaced metadata to the storage driver and return it.

```ts
// Assuming the user uploaded two images via an input field of type "file".
const browserFiles = event.target.files;

const { uri, metadata } = await metaplex
    .nfts()
    .uploadMetadata({
        name: "My NFT",
        image: await toMetaplexFileFromBrowser(browserFiles[0]),
        properties: {
            files: [
                {
                    type: "video/mp4",
                    uri: await toMetaplexFileFromBrowser(browserFiles[1]),
                },
            ]
        }
    })
    .run();

console.log(metadata.image) // https://arweave.net/123
console.log(metadata.properties.files[0].uri) // https://arweave.net/456
console.log(uri) // https://arweave.net/789
```

Note that `MetaplexFile`s can be created in various different ways based on where the file is coming from. You can [read more about `MetaplexFile` objects and how to use them here](#MetaplexFile).

### create

The `create` method accepts [a variety of parameters](/src/plugins/nftModule/createNft.ts) that define the on-chain data of the NFT. The only parameters required are its `name`, its `sellerFeeBasisPoints` — i.e. royalties — and the `uri` pointing to its JSON metadata — remember that you can use `uploadMetadata` to get that URI. All other parameters are optional as the SDK will do its best to provide sensible default values.

Here's how you can create a new NFT with minimum configuration.

```ts
const { nft } = await metaplex
    .nfts()
    .create({
        uri: "https://arweave.net/123",
        name: "My NFT",
        sellerFeeBasisPoints: 500, // Represents 5.00%.
    })
    .run();
```

This will take care of creating the mint account, the associated token account, the metadata PDA and the original edition PDA (a.k.a. the master edition) for you.

Additionally, since no other optional parameters were provided, it will do its best to provide sensible default values for the rest of the parameters. Namely:
- Since no owner, mint authority or update authority were provided, the “identity” of the SDK will be used by default for these parameters. Meaning the SDK's identity will be the owner of that new NFT.
- It will also default to setting the identity as the first and only creator with a 100% share.
- It will default to making the NFT mutable — meaning the update authority will be able to update it later on.

If some of these default parameters are not suitable for your use case, you may provide them explicitly when creating the NFT. [Here is the exhaustive list of parameters](/src/plugins/nftModule/createNft.ts) accepted by the `create` method.

### update

The `update` method accepts an `Nft` object and a set of parameters to update on the NFT. It then returns a new `Nft` object representing the updated NFT.

For instance, here is how you would change the on-chain name of an NFT.

```ts
const { nft: updatedNft } = await metaplex
    .nfts()
    .update(nft, { name: "My Updated Name" })
    .run();
```

Anything that you don’t provide in the parameters will stay unchanged.

If you’d like to change the JSON metadata of the NFT, you’d first need to upload a new metadata object using the `uploadMetadata` method and then use the provided URI to update the NFT.

```ts
const { uri: newUri } = await metaplex
    .nfts()
    .uploadMetadata({
        ...nft.json,
        name: "My Updated Metadata Name",
        description: "My Updated Metadata Description",
    })
    .run();

const { nft: updatedNft } = await metaplex
    .nfts()
    .update(nft, { uri: newUri })
    .run();
```

### printNewEdition

The `printNewEdition` method requires the mint address of the original NFT and returns a brand-new NFT printed from the original edition.

This is how you would print a new edition of the `originalNft` NFT.

```ts
const { nft: printedNft } = await metaplex
    .nfts()
    .printNewEdition(originalNft.mint)
    .run();
```

By default, it will print using the token account of the original NFT as proof of ownership, and it will do so using the current `identity` of the SDK. You may customise all of these parameters by providing them explicitly.

```ts
metaplex.nfts().printNewEdition(originalMint, {
  newMint,                   // Defaults to a brand-new Keypair.
  newUpdateAuthority,        // Defaults to the current identity.
  newOwner,                  // Defaults to the current identity.
  payer,                     // Defaults to the current identity.
  originalTokenAccountOwner, // Defaults to the current identity.
  originalTokenAccount,      // Defaults to the associated token account of the current identity.
});
```

Notice that, by default, update authority will be transfered to the metaplex identity. If you want the printed edition to retain the update authority of the original edition, you might want to provide it explicitly like so.

```ts
metaplex.nfts().printNewEdition(originalMint, {
  newUpdateAuthority: originalNft.updateAuthorityAddress,
});
```

### useNft

The `use` method requires [a usable NFT](https://docs.metaplex.com/programs/token-metadata/using-nfts) and will decrease the amount of uses by one. You may also provide the `numberOfUses` parameter, if you'd like to use it more than once in the same instruction.

```ts
const { nft: usedNft } = await mx.nfts().use(nft).run(); // Use once.
const { nft: usedNft } = await mx.nfts().use(nft, { numberOfUses: 3 }).run(); // Use three times.
```

### The `Nft` model

All of the methods above either return or interact with an `Nft` object. The `Nft` object is a read-only data representation of your NFT that contains all the information you need at the top level.

Here is an overview of the properties that are available on the `Nft` object.

```ts
type Nft = Readonly<{
    model: 'nft';
    address: PublicKey;
    metadataAddress: Pda;
    updateAuthorityAddress: PublicKey;
    json: Option<Json>;
    jsonLoaded: boolean;
    name: string;
    symbol: string;
    uri: string;
    isMutable: boolean;
    primarySaleHappened: boolean;
    sellerFeeBasisPoints: number;
    editionNonce: Option<number>;
    creators: Creator[];
    tokenStandard: Option<TokenStandard>;
    collection: Option<{
        address: PublicKey;
        verified: boolean;
    }>;
    collectionDetails: Option<{
        version: 'V1';
        size: BigNumber;
    }>;
    uses: Option<{
        useMethod: UseMethod;
        remaining: BigNumber;
        total: BigNumber;
    }>;
    mint: {
        model: 'mint';
        address: PublicKey;
        mintAuthorityAddress: Option<PublicKey>;
        freezeAuthorityAddress: Option<PublicKey>;
        decimals: number;
        supply: SplTokenAmount;
        isWrappedSol: boolean;
        currency: SplTokenCurrency;
    };
    edition:
        | {
            model: 'nftEdition';
            isOriginal: true;
            address: PublicKey;
            supply: BigNumber;
            maxSupply: Option<BigNumber>;
        }
        | {
            model: 'nftEdition';
            isOriginal: false;
            address: PublicKey;
            parent: PublicKey;
            number: BigNumber;
        };
}>
```

Additionally, The SDK may sometimes return a `Metadata` instead of an `Nft` object. The `Metadata` model contains the same data as the `Nft` model but it excludes the following properties: `json`, `mint` and `edition`. This is because they are not always needed and/or can be expensive to load. Therefore, the SDK uses the following rule of thumb:
- If you're only fetching one NFT — e.g. by using `findByMint` — then you will receive an `Nft` object containing these properties.
- If you're fetching multiple NFTs — e.g. by using `findAllByMintLint` — then you will receive an array of `Metadata` that do not contain these properties.

You may obtain an `Nft` object from a `Metadata` object by using [the `load` method](#load) explained above,

## Candy Machines
The Candy Machine module can be accessed via `metaplex.candyMachines()` and provides the following documented methods.

- [`findMintedNfts(candyMachine, options)`](#findMintedNfts)

The Candy Machine actually contains more features and models but we are still in the process of documenting them.

### findMintedNfts

The `findMintedNfts` method accepts the public key of a Candy Machine and returns all NFTs that have been minted from that Candy Machine so far.

By default, it will assume you're providing the public key of a Candy Machine v2. If you want to use a different version, you can provide the version as the second parameter.

```ts
const nfts = await metaplex.candyMachines().findMintedNfts(candyMachine).run();
const nfts = await metaplex.candyMachines().findMintedNfts(candyMachine, { version: 2 }).run(); // Equivalent to the previous line.
const nfts = await metaplex.candyMachines().findMintedNfts(candyMachine, { version: 1 }).run(); // Now finding NFTs for Candy Machine v1.
```

Note that the current implementation of this method delegates to `nfts().findAllByCreator()` whilst fetching the appropriate PDA for Candy Machines v2.

Similarly to `findAllByMintList`, the returned NFTs may be `Metadata`s.

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

const wallet = useWallet();
metaplex.use(walletAdapterIdentity(wallet));
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

Similarly to the `IdentityClient`, the `StorageClient` delegates to the current `StorageDriver` when executing these methods. We'll take a look at the storage drivers available to us, but first, let's talk about the `MetaplexFile` type which is being used throughout the `StorageClient` API.

### MetaplexFile

The `MetaplexFile` type is a simple wrapper around `Buffer` that adds additional context relevant to files and assets such as their filename, content type, extension, etc. It contains the following data.

```ts
type MetaplexFile = Readonly<{
    buffer: Buffer;
    fileName: string;
    displayName: string;
    uniqueName: string;
    contentType: string | null;
    extension: string | null;
    tags: MetaplexFileTag[];
}>
```

You may use the `toMetaplexFile` function to create a `MetaplexFile` object from a `Buffer` instance (or content `string`) and a filename. The filename is necessary to infer the extension and the mime type of the provided file.

```ts
const file = toMetaplexFile('The content of my file', 'my-file.txt');
```

You may also explicitly provide these options by passing a third parameter to the constructor.

```ts
const file = toMetaplexFile('The content of my file', 'my-file.txt', {
    displayName = 'A Nice Title For My File'; // Defaults to the filename.
    uniqueName = 'my-company/files/some-identifier'; // Defaults to a random string.
    contentType = 'text/plain'; // Infer it from filename by default.
    extension = 'txt'; // Infer it from filename by default.
    tags = [{ name: 'my-tag', value: 'some-value' }]; // Defaults to [].
});
```

Note that if you want to create a `MetaplexFile` directly from a JSON object, there's a `toMetaplexFileFromJson` helper method that you can use like so.

```ts
const file = toMetaplexFileFromJson({ foo: 42 });
```

In practice, you will most likely be creating `MetaplexFile`s from files either present on your computer or uploaded by some user on the browser. You can do the former by using `fs.readFileSync`.

```ts
const buffer = fs.readFileSync('/path/to/my-file.txt');
const file = toMetaplexFile(buffer, 'my-file.txt');
```

And the latter by using the `toMetaplexFileFromBrowser` helper method which accepts a `File` object as defined in the browser.

```ts
const browserFile: File = event.target.files[0];
const file: MetaplexFile = await toMetaplexFileFromBrowser(browserFile);
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

This storage driver is not bundled by the JS SDK by default, you first need to install it by running:

```sh
npm install @metaplex-foundation/js-plugin-aws
```

Then, to set this up, you need to pass in the AWS client as well as the bucket name you wish to use. For instance:

```ts
import { awsStorage } from "@metaplex-foundation/js-plugin-aws";
import { S3Client } from "@aws-sdk/client-s3";

const awsClient = new S3Client({
    region: "us-east-1",
    credentials: {
      accessKeyId: "",
      secretAccessKey: "",
    },
  });

metaplex.use(awsStorage(awsClient, 'my-nft-bucket'));
```

When uploading a `MetaplexFile` using `metaplex.storage().upload(file)`, the unique name of the file will be used as the AWS key. By default, this will be a random string generated by the SDK but you may explicitly provide your own like so.

```ts
const file = toMetaplexFile('file-content', 'filename.jpg', {
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

## Tasks

Tasks are a core component of the JS SDK and enable you to do more with your asynchronous operations. This includes:

- Cancelling asynchronous operations via `AbortController`s.
- Listening to status updates — e.g. pending, running, failed, etc.
- Nesting tasks together to create and keep track of more complex asynchronous operations.

The client of every module will return a `Task<T>` object where `T` is the return value you can expect when running the task using `await task.run()`.

Here's an overview of the methods available in `Task` objects.

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

As you can see, you get a bunch of methods to check the status of a task, listen to its changes, run it and reset its data. You also get a `loadWith` method which allows you to bypass the task and load the provided data directly.

You may also provide an `AbortSignal` using the `signal` property of the `TaskOptions` when running a task, allowing you to cancel the task if you need to. This needs to be supported by the concrete implementation of the task as they will have to consistently check that the task was not cancelled and return early if it was. The `force` property of `TaskOptions` can be used to force the task to run even if the task was already completed.

Tasks can also contain nested Tasks to keep track of the progress of a more complex operation if needed. You may use the `setChildren` and `getChildren` methods to add and retrieve nested tasks. The `getDescendants` method returns all the children of the task recursively.

Finally, you can set a context for the task using the `setContext` and `getContext` methods. This is useful for passing any custom data to a task such as a "name" and a "description" that can be used by the UI.
