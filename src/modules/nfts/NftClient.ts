import { ModuleClient } from '@/modules/shared';
import { Nft, updateNft, UpdateNftParams } from '@/modules/nfts';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { UpdateNftResult } from './actions';
import {
  CreateNftInput,
  CreateNftOutput,
  CreateNftOperation,
  FindNftByMintOperation,
} from './operations';

export class NftClient extends ModuleClient {
  async createNft(
    input: CreateNftInput,
    confirmOptions?: ConfirmOptions
  ): Promise<{ nft: Nft } & CreateNftOutput> {
    const operation = new CreateNftOperation(input);
    const createNftOutput = await this.metaplex.execute(operation, confirmOptions);
    const nft = await this.findNft({ mint: createNftOutput.mint.publicKey });

    return { ...createNftOutput, nft };
  }

  async findNft({ mint }: { mint: PublicKey }): Promise<Nft> {
    const nft = await this.metaplex.execute(new FindNftByMintOperation(mint));

    return nft;
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
