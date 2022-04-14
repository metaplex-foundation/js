import { PublicKey } from '@solana/web3.js';
import { ModuleClient, Plan } from '../../shared/index.js';
import { Nft } from './models/index.js';
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
} from './operations/index.js';

export class NftClient extends ModuleClient {
  findNftByMint(mint: PublicKey): Promise<Nft> {
    return this.metaplex.execute(new FindNftByMintOperation(mint));
  }

  findNftsByMintList(mints: PublicKey[]): Promise<(Nft | null)[]> {
    return this.metaplex.execute(new FindNftsByMintListOperation(mints));
  }

  findNftsByOwner(owner: PublicKey): Promise<Nft[]> {
    return this.metaplex.execute(new FindNftsByOwnerOperation(owner));
  }

  findNftsByCreator(creator: PublicKey, position: number = 1): Promise<Nft[]> {
    return this.metaplex.execute(new FindNftsByCreatorOperation({ creator, position }));
  }

  findNftsByCandyMachine(candyMachine: PublicKey, version?: 1 | 2): Promise<Nft[]> {
    return this.metaplex.execute(new FindNftsByCandyMachineOperation({ candyMachine, version }));
  }

  uploadMetadata(input: UploadMetadataInput): Promise<UploadMetadataOutput> {
    return this.metaplex.execute(new UploadMetadataOperation(input));
  }

  planUploadMetadata(input: UploadMetadataInput): Promise<Plan<undefined, UploadMetadataOutput>> {
    return this.metaplex.execute(new PlanUploadMetadataOperation(input));
  }

  async createNft(input: CreateNftInput): Promise<{ nft: Nft } & CreateNftOutput> {
    const operation = new CreateNftOperation(input);
    const createNftOutput = await this.metaplex.execute(operation);
    const nft = await this.findNftByMint(createNftOutput.mint.publicKey);

    return { ...createNftOutput, nft };
  }

  async updateNft(
    nft: Nft,
    input: Omit<UpdateNftInput, 'nft'>
  ): Promise<{ nft: Nft } & UpdateNftOutput> {
    const operation = new UpdateNftOperation({ ...input, nft });
    const updateNftOutput = await this.metaplex.execute(operation);
    const updatedNft = await this.findNftByMint(nft.mint);

    return { ...updateNftOutput, nft: updatedNft };
  }
}
