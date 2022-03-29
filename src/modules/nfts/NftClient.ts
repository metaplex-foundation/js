import { ModuleClient } from '@/modules/shared';
import {
  Nft,
  FindNftParams,
  findNft,
  CreateNftParams,
  createNft,
  updateNft,
  UpdateNftParams,
  CreateNftResult,
} from '@/modules/nfts';
import { tryOrNull } from '@/utils';
import { ConfirmOptions } from '@solana/web3.js';
import { UpdateNftResult } from './actions';

export class NftClient extends ModuleClient {
  async createNft(
    params: CreateNftParams,
    confirmOptions?: ConfirmOptions
  ): Promise<{ nft: Nft } & CreateNftResult> {
    const plan = await createNft(this.metaplex, params, confirmOptions);
    const createNftResult = await plan.execute(params);

    const nft = await this.findNft({ mint: createNftResult.mint.publicKey });
    return { ...createNftResult, nft };
  }

  async findNft(params: FindNftParams): Promise<Nft> {
    return findNft(this.metaplex, params);
  }

  async tryFindNft(params: FindNftParams): Promise<Nft | null> {
    return tryOrNull(() => this.findNft(params));
  }

  async updateNft(
    nft: Nft,
    params: UpdateNftParams,
    confirmOptions?: ConfirmOptions
  ): Promise<{ nft: Nft } & UpdateNftResult> {
    const updateNftResult = await updateNft(this.metaplex, nft, params, confirmOptions);
    const updatedNft = await this.findNft({ mint: nft.mint });

    return { ...updateNftResult, nft: updatedNft };
  }
}
