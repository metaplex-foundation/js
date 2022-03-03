import { Driver, File } from "@/drivers";

export abstract class StorageDriver extends Driver {
  public abstract upload(file: File): Promise<string>;
}
