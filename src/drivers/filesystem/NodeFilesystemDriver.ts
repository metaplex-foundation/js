import { readFile } from "fs/promises";
import { FilesystemDriver } from "./FilesystemDriver";

export class NodeFilesystemDriver extends FilesystemDriver {
  public async read(path: string) {
    return readFile(path);
  }
}
