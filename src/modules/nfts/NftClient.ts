import { ModuleClient } from '@/shared';
import { Nft } from '@/modules/nfts';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import {
  CreateNftInput,
  CreateNftOutput,
  CreateNftOperation,
  FindNftByMintOperation,
  UpdateNftInput,
  UpdateNftOutput,
  UpdateNftOperation,
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
    return this.metaplex.execute(new FindNftByMintOperation(mint));
  }

  async updateNft(
    nft: Nft,
    input: Omit<UpdateNftInput, 'nft'>,
    confirmOptions?: ConfirmOptions
  ): Promise<{ nft: Nft } & UpdateNftOutput> {
    const operation = new UpdateNftOperation({ ...input, nft });
    const updateNftOutput = await this.metaplex.execute(operation, confirmOptions);
    const updatedNft = await this.findNft({ mint: nft.mint });

    return { ...updateNftOutput, nft: updatedNft };
  }
}
