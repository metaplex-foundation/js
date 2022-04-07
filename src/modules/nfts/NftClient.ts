import { ModuleClient, Plan } from '@/shared';
import { Nft } from '@/modules/nfts';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import {
  UploadMetadataInput,
  UploadMetadataOutput,
  UploadMetadataOperation,
  PlanUploadMetadataOperation,
  CreateNftInput,
  CreateNftOutput,
  CreateNftOperation,
  FindNftByMintOperation,
  UpdateNftInput,
  UpdateNftOutput,
  UpdateNftOperation,
  FindNftsByOwnerOperation,
} from './operations';

export class NftClient extends ModuleClient {
  async uploadMetadata(
    input: UploadMetadataInput,
    confirmOptions?: ConfirmOptions
  ): Promise<UploadMetadataOutput> {
    return this.metaplex.execute(new UploadMetadataOperation(input), confirmOptions);
  }

  async planUploadMetadata(
    input: UploadMetadataInput,
    confirmOptions?: ConfirmOptions
  ): Promise<Plan<undefined, UploadMetadataOutput>> {
    return this.metaplex.execute(new PlanUploadMetadataOperation(input), confirmOptions);
  }

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

  async findNftsByOwner(owner: PublicKey): Promise<Nft[]> {
    return this.metaplex.execute(new FindNftsByOwnerOperation(owner));
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
