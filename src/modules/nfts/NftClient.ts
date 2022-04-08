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
  FindNftsByMintListOperation,
  FindNftsByCreatorOperation,
  FindNftsByCandyMachineOperation,
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
    const nft = await this.findNftByMint(createNftOutput.mint.publicKey);

    return { ...createNftOutput, nft };
  }

  async findNftByMint(mint: PublicKey): Promise<Nft> {
    return this.metaplex.execute(new FindNftByMintOperation(mint));
  }

  async findNftsByCandyMachine(candyMachine: PublicKey, version?: 1 | 2): Promise<Nft[]> {
    return this.metaplex.execute(new FindNftsByCandyMachineOperation({ candyMachine, version }));
  }

  async findNftsByCreator(creator: PublicKey, position: number = 1): Promise<Nft[]> {
    return this.metaplex.execute(new FindNftsByCreatorOperation({ creator, position }));
  }

  async findNftsByMintList(mints: PublicKey[]): Promise<Nft[]> {
    return this.metaplex.execute(new FindNftsByMintListOperation(mints));
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
    const updatedNft = await this.findNftByMint(nft.mint);

    return { ...updateNftOutput, nft: updatedNft };
  }
}
