import { NFTStorage } from "nft.storage";
import BN from "bn.js";
import { Metaplex } from "@/Metaplex";
import { MetaplexFile } from "../filesystem/MetaplexFile";
import { StorageDriver } from "./StorageDriver";

export const nftStorageStorage = (token: string) => (metaplex: Metaplex) =>
  new NftStorageStorageDriver(metaplex, token);

export class NftStorageStorageDriver extends StorageDriver {
  protected readonly nftStorage: NFTStorage;

  constructor(metaplex: Metaplex, token: string) {
    super(metaplex);
    this.nftStorage = new NFTStorage({ token });
  }

  public async getPrice(_file: MetaplexFile): Promise<BN> {
    return new BN(0);
  }

  public async upload(file: MetaplexFile): Promise<string> {
    const { url } = await this.nftStorage.store({
      image: file.toGlobalFile(),
      name: file.displayName,
      description: "Unknown",
    });

    return url;
  }
}
