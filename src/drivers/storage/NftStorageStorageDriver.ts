import { NFTStorage } from 'nft.storage';
import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/MetaplexPlugin';
import { MetaplexFile } from '../filesystem/MetaplexFile';
import { StorageDriver } from './StorageDriver';
import { SolAmount } from '@/shared';

export const nftStorageStorage = (token: string): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.setStorage(new NftStorageStorageDriver(metaplex, token));
  },
});

export class NftStorageStorageDriver extends StorageDriver {
  protected readonly nftStorage: NFTStorage;

  constructor(metaplex: Metaplex, token: string) {
    super(metaplex);
    this.nftStorage = new NFTStorage({ token });
  }

  public async getPrice(..._files: MetaplexFile[]): Promise<SolAmount> {
    return SolAmount.zero();
  }

  public async upload(file: MetaplexFile): Promise<string> {
    const { url } = await this.nftStorage.store({
      image: file.toGlobalFile(),
      name: file.displayName,
      description: 'Unknown',
    });

    return url;
  }
}
