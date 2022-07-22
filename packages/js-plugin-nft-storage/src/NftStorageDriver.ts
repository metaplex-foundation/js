import { NFTStorage } from 'nft.storage';
import { MemoryBlockStore } from 'ipfs-car/blockstore/memory';
import { NFTStorageMetaplexor } from '@nftstorage/metaplex-auth';
import {
  MetaplexFile,
  StorageDriver,
  lamports,
  Amount,
  Metaplex,
  Signer,
  isKeypairSigner,
  assert,
} from '@metaplex-foundation/js';
import { toGatewayUri, toIpfsUri } from './utils';

export type NftStorageDriverOptions = {
  identity?: Signer;
  token?: string;
  endpoint?: URL;
  gatewayHost?: string;
  batchSize?: number;
  useGatewayUrls?: boolean;
};

export class NftStorageDriver implements StorageDriver {
  readonly metaplex: Metaplex;
  readonly identity?: Signer;
  readonly token?: string;
  readonly endpoint?: URL;
  readonly gatewayHost?: string;
  onStoredChunk?: (size: number) => void;
  batchSize: number;
  useGatewayUrls: boolean;

  constructor(metaplex: Metaplex, options: NftStorageDriverOptions = {}) {
    this.metaplex = metaplex;
    this.identity = options.identity;
    this.token = options.token;
    this.endpoint = options.endpoint;
    this.gatewayHost = options.gatewayHost;
    this.batchSize = options.batchSize ?? 50;
    this.useGatewayUrls = options.useGatewayUrls ?? true;
  }

  onProgress(callback: (size: number) => void) {
    this.onStoredChunk = callback;
    return this;
  }

  async getUploadPrice(_bytes: number): Promise<Amount> {
    return lamports(0);
  }

  async upload(file: MetaplexFile): Promise<string> {
    return (await this.uploadAll([file]))[0];
  }

  async uploadAll(files: MetaplexFile[]): Promise<string[]> {
    assert(this.batchSize > 0, 'batchSize must be greater than 0');
    const client = await this.client();
    const blockstore = new MemoryBlockStore();
    const uris: string[] = [];
    const numBatches = Math.ceil(files.length / this.batchSize);
    const batches: MetaplexFile[][] = new Array(numBatches).map((_, i) =>
      files.slice(i * this.batchSize, (i + 1) * this.batchSize)
    );

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      for (let j = 0; j < batch.length; j++) {
        const file = batch[j];
        const blob = new Blob([file.buffer]);
        const { cid } = await NFTStorage.encodeBlob(blob, { blockstore });
        const fileUri = this.useGatewayUrls
          ? toGatewayUri(cid.toString(), file.fileName, this.gatewayHost)
          : toIpfsUri(cid.toString(), file.fileName);
        uris.push(fileUri);
      }

      const { cid } = await NFTStorage.encodeDirectory([batch], { blockstore });
      const cid = ''; // TODO
      const car = ''; // TODO

      const options = { onStoredChunk: this.onStoredChunk };
      const promise = isNFTStorageMetaplexor(client)
        ? client.storeCar(cid, car, options)
        : client.storeCar(car, options);

      await promise;
    }

    return uris;
  }

  async client(): Promise<NFTStorage | NFTStorageMetaplexor> {
    if (this.token) {
      return new NFTStorage({
        token: this.token,
        endpoint: this.endpoint,
      });
    }

    const signer: Signer = this.identity ?? this.metaplex.identity();
    const authOptions = {
      mintingAgent: '@metaplex-foundation/js-plugin-nft-storage',
      solanaCluster: this.metaplex.cluster,
      endpoint: this.endpoint,
    };

    return isKeypairSigner(signer)
      ? NFTStorageMetaplexor.withSecretKey(signer.secretKey, authOptions)
      : NFTStorageMetaplexor.withSigner(
          signer.signMessage.bind(signer),
          signer.publicKey.toBuffer(),
          authOptions
        );
  }
}

const isNFTStorageMetaplexor = (
  client: NFTStorage | NFTStorageMetaplexor
): client is NFTStorageMetaplexor => {
  return 'storeNFTFromFilesystem' in client;
};
