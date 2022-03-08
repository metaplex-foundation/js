import BN from "bn.js";
import { Driver } from "../Driver";
import { MetaplexFile } from "../filesystem/MetaplexFile";

export abstract class StorageDriver extends Driver {
  public abstract getPrice(file: MetaplexFile): Promise<BN>;
  public abstract upload(file: MetaplexFile): Promise<string>;
}
