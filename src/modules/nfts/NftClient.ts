import { ModuleClient } from '@/modules/shared';
import { Nft, FindNftParams, findNft, updateNft, UpdateNftParams } from '@/modules/nfts';
import { tryOrNull } from '@/utils';
import { ConfirmOptions } from '@solana/web3.js';
import { UpdateNftResult } from './actions';
import { CreateNftInput, CreateNftOutput, CreateNftOperation } from './operations';

export class NftClient extends ModuleClient {
  async createNft(
    input: CreateNftInput,
    confirmOptions?: ConfirmOptions
  ): Promise<{ nft: Nft } & CreateNftOutput> {
    const createNftOutput = await this.metaplex.execute(new CreateNftOperation(input), confirmOptions);
    const nft = await this.findNft({ mint: createNftOutput.mint.publicKey });

    return { ...createNftOutput, nft };
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
