import NodeBundlr, { WebBundlr } from "@bundlr-network/client";
import { Metaplex } from "@/Metaplex";
import { StorageDriver } from "./StorageDriver";
import { MetaplexFile } from "../filesystem/MetaplexFile";
import BN from "bn.js";

export interface BundlrOptions {
  address?: string;
  timeout?: number;
  providerUrl?: string;
}

export const bundlrStorage = (options: BundlrOptions = {}) => 
  (metaplex: Metaplex) => new BundlrStorageDriver(metaplex, options);

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

  public async getPrice(file: MetaplexFile): Promise<BN> {
    const bundlr = await this.getBundlr();
    const price = await bundlr.getPrice(file.toBuffer().length);

    return new BN(price.toString());
  }

  public async upload(file: MetaplexFile): Promise<string> {
    const bundlr = await this.getBundlr();
    const price = await bundlr.getPrice(file.toBuffer().length);
    await bundlr.fund(price);

    const { status, data } = await bundlr.uploader.upload(
      file.toBuffer(),
      file.getTagsWithContentType(),
    );

    if (status >= 300) {
      // TODO: Custom errors.
      throw new Error(`Failed to upload asset. Got status: ${status}.`);
    }

    // TODO: withdraw any money left in the balance?

    return `https://arweave.net/${data.id}`;
  }

  protected async getBundlr(): Promise<WebBundlr | NodeBundlr> {
    if (this.bundlr) return this.bundlr;

    const currency = "solana";
    const address = this.options?.address ?? "https://node1.bundlr.network";
    const bundlr = new WebBundlr(address, currency, this.metaplex.identity(), {
      timeout: this.options.timeout,
      providerUrl: this.options.providerUrl,
    });

    try {
      // Check for valid bundlr node.
      await bundlr.utils.getBundlerAddress(currency)
    } catch (error) {
      // TODO: Custom errors.
      throw new Error(`Failed to connect to bundlr ${address}.`);
    }

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

    this.bundlr = bundlr;

    return bundlr;
  }
}
