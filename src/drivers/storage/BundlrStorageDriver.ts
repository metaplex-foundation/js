import NodeBundlr, { WebBundlr } from "@bundlr-network/client";
import { StorageDriver, File } from "@/drivers";
import { Metaplex } from "@/Metaplex";

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

  public async upload(content: string | Buffer | File): Promise<string> {
    if (content instanceof File) {
      content = content.content;
    }

    const bundlr = await this.getBundlr();

    //
  }

  protected async getBundlr(): Promise<WebBundlr | NodeBundlr> {
    if (this.bundlr) return this.bundlr;
    const address = this.options?.address ?? "https://node1.bundlr.network";
    this.bundlr = new WebBundlr(address, "solana", this.metaplex.identity(), {
      timeout: this.options.timeout,
      providerUrl: this.options.providerUrl,
    });

    return this.bundlr;
  }
}
