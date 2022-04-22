import { PublicKey } from '@solana/web3.js';
import { ModuleClient, Plan } from '@/shared';
import {
  PrintNewEditionInput,
  printNewEditionOperation,
  PrintNewEditionOutput,
  Nft,
} from '@/modules/nfts';
import {
  UploadMetadataInput,
  UploadMetadataOutput,
  uploadMetadataOperation,
  planUploadMetadataOperation,
  CreateNftInput,
  CreateNftOutput,
  createNftOperation,
  findNftByMintOperation,
  UpdateNftInput,
  UpdateNftOutput,
  updateNftOperation,
  findNftsByOwnerOperation,
  findNftsByMintListOperation,
  findNftsByCreatorOperation,
  findNftsByCandyMachineOperation,
} from './operations';

export class NftClient extends ModuleClient {
  findNftByMint(mint: PublicKey): Promise<Nft> {
    return this.metaplex.execute(findNftByMintOperation(mint));
  }

  findNftsByMintList(mints: PublicKey[]): Promise<(Nft | null)[]> {
    return this.metaplex.execute(findNftsByMintListOperation(mints));
  }

  findNftsByOwner(owner: PublicKey): Promise<Nft[]> {
    return this.metaplex.execute(findNftsByOwnerOperation(owner));
  }

  findNftsByCreator(creator: PublicKey, position: number = 1): Promise<Nft[]> {
    return this.metaplex.execute(findNftsByCreatorOperation({ creator, position }));
  }

  findNftsByCandyMachine(candyMachine: PublicKey, version?: 1 | 2): Promise<Nft[]> {
    return this.metaplex.execute(findNftsByCandyMachineOperation({ candyMachine, version }));
  }

  uploadMetadata(input: UploadMetadataInput): Promise<UploadMetadataOutput> {
    return this.metaplex.execute(uploadMetadataOperation(input));
  }

  planUploadMetadata(input: UploadMetadataInput): Promise<Plan<undefined, UploadMetadataOutput>> {
    return this.metaplex.execute(planUploadMetadataOperation(input));
  }

  async createNft(input: CreateNftInput): Promise<{ nft: Nft } & CreateNftOutput> {
    const operation = createNftOperation(input);
    const createNftOutput = await this.metaplex.execute(operation);
    const nft = await this.findNftByMint(createNftOutput.mint.publicKey);

    return { ...createNftOutput, nft };
  }

  async updateNft(
    nft: Nft,
    input: Omit<UpdateNftInput, 'nft'>
  ): Promise<{ nft: Nft } & UpdateNftOutput> {
    const operation = updateNftOperation({ ...input, nft });
    const updateNftOutput = await this.metaplex.execute(operation);
    const updatedNft = await this.findNftByMint(nft.mint);

    return { ...updateNftOutput, nft: updatedNft };
  }

  async printNewEdition(
    input: PrintNewEditionInput
  ): Promise<{ nft: Nft } & PrintNewEditionOutput> {
    const operation = printNewEditionOperation(input);
    const printNewEditionOutput = await this.metaplex.execute(operation);
    const nft = await this.findNftByMint(printNewEditionOutput.mint.publicKey);

    return { ...printNewEditionOutput, nft };
  }
}
