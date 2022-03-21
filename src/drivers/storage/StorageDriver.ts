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

    return this.upload(new MetaplexFile(jsonString, 'inline.json'));
  }

  public async download(uri: string): Promise<MetaplexFile> {
    const response = await fetch(uri);
    const buffer = await response.arrayBuffer();

    // Identify content type and extension.
    const { fileTypeFromBuffer } = await import('file-type');
    const fileType = await fileTypeFromBuffer(buffer);
    const options = fileType ? { contentType: fileType.mime, extension: fileType.ext } : {};
    const filename = fileType ? `downloaded.${fileType.ext}` : 'downloaded';

    return new MetaplexFile(await response.arrayBuffer(), filename, options);
  }

  public async downloadJson<T extends object>(uri: string): Promise<T> {
    const response = await fetch(uri);

    return await response.json();
  }
}
