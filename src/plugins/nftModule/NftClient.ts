import { PublicKey } from '@solana/web3.js';
import { ModuleClient } from '@/types';
import { Plan } from '@/utils';
import { Nft } from './Nft';
import { findNftByMintOperation } from './findNftByMint';
import { findNftsByMintListOperation } from './findNftsByMintList';
import { findNftsByOwnerOperation } from './findNftsByOwner';
import { findNftsByCreatorOperation } from './findNftsByCreator';
import { findNftsByCandyMachineOperation } from './findNftsByCandyMachine';
import {
  UploadMetadataInput,
  uploadMetadataOperation,
  UploadMetadataOutput,
} from './uploadMetadata';
import { planUploadMetadataOperation } from './planUploadMetadata';
import { CreateNftInput, createNftOperation, CreateNftOutput } from './createNft';
import { UpdateNftInput, updateNftOperation, UpdateNftOutput } from './updateNft';
import {
  printNewEditionOperation,
  PrintNewEditionOutput,
  PrintNewEditionSharedInput,
  PrintNewEditionViaInput,
} from './printNewEdition';

export class NftClient extends ModuleClient {
  findNftByMint(mint: PublicKey): Promise<Nft> {
    return this.metaplex.operations().execute(findNftByMintOperation(mint));
  }

  findNftsByMintList(mints: PublicKey[]): Promise<(Nft | null)[]> {
    return this.metaplex.operations().execute(findNftsByMintListOperation(mints));
  }

  findNftsByOwner(owner: PublicKey): Promise<Nft[]> {
    return this.metaplex.operations().execute(findNftsByOwnerOperation(owner));
  }

  findNftsByCreator(creator: PublicKey, position: number = 1): Promise<Nft[]> {
    return this.metaplex.operations().execute(findNftsByCreatorOperation({ creator, position }));
  }

  findNftsByCandyMachine(candyMachine: PublicKey, version?: 1 | 2): Promise<Nft[]> {
    return this.metaplex
      .operations()
      .execute(findNftsByCandyMachineOperation({ candyMachine, version }));
  }

  uploadMetadata(input: UploadMetadataInput): Promise<UploadMetadataOutput> {
    return this.metaplex.operations().execute(uploadMetadataOperation(input));
  }

  planUploadMetadata(input: UploadMetadataInput): Promise<Plan<undefined, UploadMetadataOutput>> {
    return this.metaplex.operations().execute(planUploadMetadataOperation(input));
  }

  async createNft(input: CreateNftInput): Promise<{ nft: Nft } & CreateNftOutput> {
    const operation = createNftOperation(input);
    const createNftOutput = await this.metaplex.operations().execute(operation);
    const nft = await this.findNftByMint(createNftOutput.mint.publicKey);

    return { ...createNftOutput, nft };
  }

  async updateNft(
    nft: Nft,
    input: Omit<UpdateNftInput, 'nft'>
  ): Promise<{ nft: Nft } & UpdateNftOutput> {
    const operation = updateNftOperation({ ...input, nft });
    const updateNftOutput = await this.metaplex.operations().execute(operation);
    const updatedNft = await this.findNftByMint(nft.mint);

    return { ...updateNftOutput, nft: updatedNft };
  }

  async printNewEdition(
    originalMint: PublicKey,
    input: Omit<PrintNewEditionSharedInput, 'originalMint'> & PrintNewEditionViaInput = {}
  ): Promise<{ nft: Nft } & PrintNewEditionOutput> {
    const operation = printNewEditionOperation({ originalMint, ...input });
    const printNewEditionOutput = await this.metaplex.operations().execute(operation);
    const nft = await this.findNftByMint(printNewEditionOutput.mint.publicKey);

    return { ...printNewEditionOutput, nft };
  }
}
