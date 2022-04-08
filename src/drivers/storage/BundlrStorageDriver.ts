import NodeBundlr, { WebBundlr } from '@bundlr-network/client';
import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/MetaplexPlugin';
import { StorageDriver } from './StorageDriver';
import { MetaplexFile } from '../filesystem/MetaplexFile';
import { KeypairIdentityDriver } from '../identity/KeypairIdentityDriver'
import { PlanUploadMetadataOperation } from '@/modules';
import { PlanUploadMetadataUsingBundlrOperationHandler } from './PlanUploadMetadataUsingBundlrOperationHandler';
import { SolAmount } from '@/shared';

export interface BundlrOptions {
  address?: string;
  timeout?: number;
  providerUrl?: string;
  priceMultiplier?: number;
}

export const bundlrStorage = (options: BundlrOptions = {}): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.setStorage(new BundlrStorageDriver(metaplex, options));
    metaplex.register(PlanUploadMetadataOperation, PlanUploadMetadataUsingBundlrOperationHandler);
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
    const price = await this.getMultipliedPrice(files);

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
    const price = await this.getMultipliedPrice(files);

    return price.isGreaterThan(balance);
  }

  public async fund(files: MetaplexFile[], skipBalanceCheck = false): Promise<void> {
    const bundlr = await this.getBundlr();
    const price = await this.getMultipliedPrice(files);

    if (skipBalanceCheck) {
      await bundlr.fund(price);
      return;
    }

    const balance = await bundlr.getLoadedBalance();

    if (price.isGreaterThan(balance)) {
      await bundlr.fund(price.minus(balance));
    }
  }

  protected async getMultipliedPrice(files: MetaplexFile[]) {
    const bundlr = await this.getBundlr();
    const bytes = files.reduce((total, file) => total + file.getBytes(), 0);
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
      // TODO: Custom errors.
      throw new Error(`Failed to upload asset. Got status: ${status}.`);
    }

    return `https://arweave.net/${data.id}`;
  }

  protected async withdrawAll(): Promise<void> {
    // TODO: Implement when available on Bundlr.
    throw new Error('Method not implemented.');
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
