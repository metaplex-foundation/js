import NodeBundlr, { WebBundlr } from '@bundlr-network/client';
import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/MetaplexPlugin';
import { StorageDriver } from './StorageDriver';
import { MetaplexFile } from '../filesystem/MetaplexFile';
import BN from 'bn.js';
import { WalletAdapterIdentityDriver } from '../identity/WalletAdapterIdentityDriver';

export interface BundlrOptions {
  address?: string;
  timeout?: number;
  providerUrl?: string;
  priceMultiplier?: number;
}

export const bundlrStorage = (options: BundlrOptions = {}): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.setStorage(new BundlrStorageDriver(metaplex, options));
  },
});

export class BundlrStorageDriver extends StorageDriver {
  protected bundlr: WebBundlr | NodeBundlr | null = null;
  protected options: BundlrOptions;

  constructor(metaplex: Metaplex, options: BundlrOptions = {}) {
    super(metaplex);
    this.options = {
      providerUrl: metaplex.endpoint,
      ...options,
    };
  }

  public async getPrice(...files: MetaplexFile[]): Promise<BN> {
    const price = await this.getMultipliedPrice(files);

    return new BN(price.toString());
  }

  public async upload(file: MetaplexFile): Promise<string> {
    const [uri] = await this.uploadAll([file]);

    return uri;
  }

  public async uploadAll(files: MetaplexFile[]): Promise<string[]> {
    await this.fund(files);
    const promises = files.map((file) => this.uploadFile(file));

    return Promise.all(promises);
  }

  protected async getMultipliedPrice(files: MetaplexFile[]) {
    const bundlr = await this.getBundlr();
    const bytes = files.reduce((total, file) => total + file.getBytes(), 0);
    const price = await bundlr.getPrice(bytes);

    return price.multipliedBy(this.options.priceMultiplier ?? 1.5);
  }

  protected async fund(files: MetaplexFile[]): Promise<void> {
    const bundlr = await this.getBundlr();
    const price = await this.getMultipliedPrice(files);
    // TODO: Check current balance to only top-up what's necessary, if necessary?

    await bundlr.fund(price);
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

    // TODO: withdraw any money left in the balance?

    return `https://arweave.net/${data.id}`;
  }

  protected async withdrawAll(): Promise<void> {
    // TODO: Implement when available on Bundlr.
    throw new Error('Method not implemented.');
  }

  protected async getBundlr(): Promise<WebBundlr | NodeBundlr> {
    if (this.bundlr) return this.bundlr;

    const currency = 'solana';
    const address = this.options?.address ?? 'https://node1.bundlr.network';
    const options = {
      timeout: this.options.timeout,
      providerUrl: this.options.providerUrl,
    };

    const bundlr =
      this.metaplex.identity() instanceof WalletAdapterIdentityDriver
        ? new WebBundlr(address, currency, this.metaplex.identity(), options)
        : new NodeBundlr(address, currency, this.metaplex.identity(), options);

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
