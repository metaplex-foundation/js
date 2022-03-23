import { ModuleClient } from '@/modules/shared';
import {
  Nft,
  FindNftParams,
  findNft,
  CreateNftParams,
  createNft,
  updateNft,
  UpdateNftParams,
  UpdateNftResult,
} from '@/modules/nfts';
import { tryOrNull } from '@/utils';

export class NftClient extends ModuleClient {
  async createNft(params: CreateNftParams): Promise<Nft> {
    const { mint } = await createNft(this.metaplex, params);

    return this.findNft({ mint: mint.publicKey });
  }

  async findNft(params: FindNftParams): Promise<Nft> {
    return findNft(this.metaplex, params);
  }

  async tryFindNft(params: FindNftParams): Promise<Nft | null> {
    return tryOrNull(() => this.findNft(params));
  }

  async updateNft(params: UpdateNftParams): Promise<UpdateNftResult> {
    return updateNft(this.metaplex, params);
  }
}
