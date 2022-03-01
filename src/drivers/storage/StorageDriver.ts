import { Driver, File } from "@/drivers";

export abstract class StorageDriver extends Driver {
  public abstract upload(content: string | Buffer | File): Promise<string>;
}
