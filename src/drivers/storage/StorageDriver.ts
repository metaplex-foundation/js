import BN from "bn.js";
import { Driver } from "../Driver";
import { MetaplexFile } from "../filesystem/MetaplexFile";

export abstract class StorageDriver extends Driver {
  public abstract getPrice(file: MetaplexFile): Promise<BN>;
  public abstract upload(file: MetaplexFile): Promise<string>;

  public async uploadJson<T extends object>(json: T): Promise<string> {
    let jsonString;

    try {
      jsonString = JSON.stringify(json);
    } catch (error) {
      // TODO: Custom errors.
      throw new Error('Invalid JSON');
    }

    return this.upload(new MetaplexFile(jsonString));
  }
}
