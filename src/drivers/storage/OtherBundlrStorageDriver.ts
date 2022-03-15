import { Keypair } from "@solana/web3.js";
import Bundlr from "@bundlr-network/client";
import BN from "bn.js";
import { Metaplex } from "@/Metaplex";
import { StorageDriver } from "./StorageDriver";
import { MetaplexFile } from "../filesystem/MetaplexFile";
import { transferBuilder } from "@/programs/system";

export interface OtherBundlrOptions {
  address?: string;
  timeout?: number;
  providerUrl?: string;
  priceMultipler?: number;
}

export const otherBundlrStorage = (options: OtherBundlrOptions = {}) => 
  (metaplex: Metaplex) => new OtherBundlrStorageDriver(metaplex, options);

export class OtherBundlrStorageDriver extends StorageDriver {
  protected bundlr: Bundlr | null = null;
  protected keypair: Keypair;
  protected options: OtherBundlrOptions;

  constructor(metaplex: Metaplex, options: OtherBundlrOptions = {}) {
    super(metaplex);
    this.keypair = Keypair.generate();
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
    const priceMultipler = this.options.priceMultipler ?? 1.5;
    const multipliedPrice = price.multipliedBy(priceMultipler);

    await this.metaplex.sendAndConfirmTransaction(transferBuilder({
      from: this.metaplex.identity(),
      to: this.keypair.publicKey,
      lamports: multipliedPrice.toNumber(),
    }));

    await bundlr.fund(multipliedPrice);

    // TODO: Add support for tags. E.g. "Content-Type".
    const tags: { name: string, value: string }[] = [];
    const { status, data } = await bundlr.uploader.upload(file.toBuffer(), tags);

    if (status >= 300) {
      // TODO: Custom errors.
      throw new Error(`Failed to upload asset. Got status: ${status}.`);
    }

    return `https://arweave.net/${data.id}`;
  }

  protected async getBundlr(): Promise<Bundlr> {
    if (this.bundlr) return this.bundlr;

    const currency = "solana";
    const address = this.options?.address ?? "https://node1.bundlr.network";
    const bundlr = new Bundlr(address, currency, this.keypair, {
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

    this.bundlr = bundlr;

    return bundlr;
  }
}
