import BN from "bn.js";
import { Metaplex } from "@/Metaplex";
import { MetaplexFile } from "../filesystem/MetaplexFile";
import { StorageDriver } from "./StorageDriver";

export const mockStorage = () => 
  (metaplex: Metaplex) => new mockStorageDriver(metaplex);

export class mockStorageDriver extends StorageDriver {

  public async getPrice(_file: MetaplexFile): Promise<BN> {
    return new BN(0);
  }

  public async upload(_file: MetaplexFile): Promise<string> {
    const seed = Math.round(Math.random() * 1000);

    return `https://picsum.photos/seed/${seed}/300/300`;
  }
}
