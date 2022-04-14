import { Driver } from '../Driver.js';
import { MetaplexFile } from './MetaplexFile.js';

export abstract class FilesystemDriver extends Driver {
  public abstract fileExists(path: string): Promise<boolean>;
  public abstract directoryExists(path: string): Promise<boolean>;
  public abstract has(path: string): Promise<boolean>;
  public abstract read(path: string): Promise<MetaplexFile>;
}
