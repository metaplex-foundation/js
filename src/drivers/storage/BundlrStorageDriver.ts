import NodeBundlr, { WebBundlr } from '@bundlr-network/client';
import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/MetaplexPlugin';
import { StorageDriver } from './StorageDriver';
import { MetaplexFile } from '../filesystem/MetaplexFile';
import { KeypairIdentityDriver } from '../identity/KeypairIdentityDriver';
import { planUploadMetadataOperation } from '@/modules';
import { planUploadMetadataUsingBundlrOperationHandler } from './planUploadMetadataUsingBundlrOperationHandler';
import { SolAmount } from '@/shared';
import { BundlrError, SdkError } from '@/errors';

export interface BundlrOptions {
  address?: string;
  timeout?: number;
  providerUrl?: string;
  priceMultiplier?: number;
}

export const bundlrStorage = (options: BundlrOptions = {}): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.setStorage(new BundlrStorageDriver(metaplex, options));
    metaplex.register(planUploadMetadataOperation, planUploadMetadataUsingBundlrOperationHandler);
  },
});

export class BundlrStorageDriver extends StorageDriver {
  protected bundlr: WebBundlr | NodeBundlr | null = null;
  protected options: BundlrOptions;

  constructor(metaplex: Metaplex, options: BundlrOptions = {}) {
    super(metaplex);
    this.options = {
      providerUrl: metaplex.connection.rpcEndpoint,
      ...options,
    };
  }

  public async getBalance(): Promise<SolAmount> {
    const bundlr = await this.getBundlr();
    const balance = await bundlr.getLoadedBalance();

    return SolAmount.fromLamports(balance);
  }

  public async getPrice(...files: MetaplexFile[]): Promise<SolAmount> {
    const bytes = this.getBytes(files);
    const price = await this.getMultipliedPrice(bytes);

    return SolAmount.fromLamports(price);
  }

  public async upload(file: MetaplexFile): Promise<string> {
    const [uri] = await this.uploadAll([file]);

    return uri;
  }

  public async uploadAll(files: MetaplexFile[]): Promise<string[]> {
    await this.fund(files);
    const promises = files.map((file) => this.uploadFile(file));
    // TODO: withdraw any money left in the balance?

    return Promise.all(promises);
  }

  public async needsFunding(files: MetaplexFile[]): Promise<boolean> {
    const bundlr = await this.getBundlr();
    const balance = await bundlr.getLoadedBalance();
    const bytes = this.getBytes(files);
    const price = await this.getMultipliedPrice(bytes);

    return price.isGreaterThan(balance);
  }

  public async fund(files: MetaplexFile[], skipBalanceCheck = false): Promise<void> {
    await this.fundBytes(this.getBytes(files), skipBalanceCheck);
  }

  public async fundBytes(bytes: number, skipBalanceCheck = false): Promise<void> {
    const bundlr = await this.getBundlr();
    const price = await this.getMultipliedPrice(bytes);

    if (skipBalanceCheck) {
      await bundlr.fund(price);
      return;
    }

    const balance = await bundlr.getLoadedBalance();

    if (price.isGreaterThan(balance)) {
      await bundlr.fund(price.minus(balance));
    }
  }

  protected getBytes(files: MetaplexFile[]): number {
    return files.reduce((total, file) => total + file.getBytes(), 0);
  }

  protected async getMultipliedPrice(bytes: number): Promise<any> {
    const bundlr = await this.getBundlr();
    const price = await bundlr.getPrice(bytes);

    return price.multipliedBy(this.options.priceMultiplier ?? 1.5).decimalPlaces(0);
  }

  protected async uploadFile(file: MetaplexFile): Promise<string> {
    const bundlr = await this.getBundlr();
    const { status, data } = await bundlr.uploader.upload(
      file.toBuffer(),
      file.getTagsWithContentType()
    );

    if (status >= 300) {
      throw BundlrError.assetUploadFailed(status);
    }

    return `https://arweave.net/${data.id}`;
  }

  protected async withdrawAll(): Promise<void> {
    // TODO: Implement when available on Bundlr.
    throw SdkError.notYetImplemented();
  }

  public async getBundlr(): Promise<WebBundlr | NodeBundlr> {
    if (this.bundlr) return this.bundlr;

    const currency = 'solana';
    const address = this.options?.address ?? 'https://node1.bundlr.network';
    const options = {
      timeout: this.options.timeout,
      providerUrl: this.options.providerUrl,
    };

    const identity = this.metaplex.identity();

    const bundlr =
      identity instanceof KeypairIdentityDriver
        ? new NodeBundlr(address, currency, identity.keypair.secretKey, options)
        : new WebBundlr(address, currency, identity, options);
    try {
      // Check for valid bundlr node.
      await bundlr.utils.getBundlerAddress(currency);
    } catch (error) {
      // TODO: Custom errors.
      throw new Error(`Failed to connect to bundlr ${address}.`);
    }

    if (bundlr instanceof WebBundlr) {
      try {
        // Try to initiate bundlr.
        await bundlr.ready();
      } catch (error) {
        console.error(error);
      }

      if (!bundlr.address) {
        // TODO: Custom errors.
        throw new Error('Failed to initiate Bundlr.');
      }
    }

    this.bundlr = bundlr;

    return bundlr;
  }
}
