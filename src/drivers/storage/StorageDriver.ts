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

  public async download(uri: string): Promise<MetaplexFile> {
    const response = await fetch(uri);

    return new MetaplexFile(await response.arrayBuffer());
  }

  public async downloadJson<T extends object>(uri: string): Promise<T> {
    const response = await fetch(uri);

    return await response.json();
  }
}
