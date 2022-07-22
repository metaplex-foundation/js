import {
  MetaplexFile,
  StorageDriver,
  lamports,
  Amount,
} from '@metaplex-foundation/js';

export class NftStorageDriver implements StorageDriver {
  constructor() {
    // TODO
  }

  async getUploadPrice(_bytes: number): Promise<Amount> {
    return lamports(0);
  }

  async upload(file: MetaplexFile): Promise<string> {
    // TODO
  }
}
