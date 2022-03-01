import { Driver } from "@/drivers";

export abstract class FilesystemDriver extends Driver {
  public abstract read(path: string): Promise<Buffer>;
}
