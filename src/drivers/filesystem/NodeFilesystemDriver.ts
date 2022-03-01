import { readFile, lstat } from "fs/promises";
import { FilesystemDriver } from "./FilesystemDriver";
import { File } from "./File";

export class NodeFilesystemDriver extends FilesystemDriver {

  public async fileExists(path: string): Promise<boolean> {
    try {
      const stats = await lstat(path);
      return stats.isFile();
    } catch (error) {
      return false;
    }
  }

  public async directoryExists(path: string): Promise<boolean> {
    try {
      const stats = await lstat(path);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  public async has(path: string): Promise<boolean> {
    try {
      await lstat(path);
      return true;
    } catch (error) {
      return false;
    }
  }

  public async read(path: string) {
    return new File(await readFile(path));
  }
}
