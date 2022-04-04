import { SolAmount } from '@/shared';
import { Driver } from '../Driver';
import { MetaplexFile } from '../filesystem/MetaplexFile';

export abstract class StorageDriver extends Driver {
  public abstract getPrice(...files: MetaplexFile[]): Promise<SolAmount>;
  public abstract upload(file: MetaplexFile): Promise<string>;

  public async uploadAll(files: MetaplexFile[]): Promise<string[]> {
    const promises = files.map((file) => this.upload(file));

    return Promise.all(promises);
  }

  public async uploadJson<T extends object>(json: T): Promise<string> {
    return this.upload(MetaplexFile.fromJson(json));
  }

  public async download(uri: string): Promise<MetaplexFile> {
    const response = await fetch(uri);
    const buffer = await response.arrayBuffer();

    return new MetaplexFile(buffer, uri);
  }

  public async downloadJson<T extends object>(uri: string): Promise<T> {
    const response = await fetch(uri);

    return await response.json();
  }
}
