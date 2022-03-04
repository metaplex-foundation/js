import NodeBundlr, { WebBundlr } from "@bundlr-network/client";
import { Metaplex } from "@/Metaplex";
import { StorageDriver } from "./StorageDriver";
import { File } from "../filesystem/File";

export interface BundlrOptions {
  address?: string;
  timeout?: number;
  providerUrl?: string;
}

export class BundlrStorageDriver extends StorageDriver {
  protected bundlr: WebBundlr | NodeBundlr | null = null;
  protected options: BundlrOptions;

  constructor(metaplex: Metaplex, options: BundlrOptions = {}) {
    super(metaplex);
    this.options = options;
  }

  public async upload(file: File): Promise<string> {
    const bundlr = await this.getBundlr();
    const price = await bundlr.getPrice(file.toBuffer().length);
    await bundlr.fund(price);

    // TODO: Add support for tags. E.g. "Content-Type".
    const tags: { name: string, value: string }[] = [];
    const { status, data } = await bundlr.uploader.upload(file.toBuffer(), tags);

    if (status >= 300) {
      // TODO: Custom errors.
      throw new Error(`Failed to upload asset. Got status: ${status}.`);
    }

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
