import { Driver } from "../Driver";
import { File } from "../filesystem/File";

export abstract class StorageDriver extends Driver {
  public abstract upload(file: File): Promise<string>;
}
