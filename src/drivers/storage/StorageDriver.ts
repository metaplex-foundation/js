import { Driver } from "../Driver";
import { MetaplexFile } from "../filesystem/MetaplexFile";

export abstract class StorageDriver extends Driver {
  public abstract upload(file: MetaplexFile): Promise<string>;
}
