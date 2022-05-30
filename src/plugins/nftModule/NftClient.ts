import { PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
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
import {
  CreateNftInput,
  createNftOperation,
  CreateNftOutput,
} from './createNft';
import {
  UpdateNftInput,
  updateNftOperation,
  UpdateNftOutput,
} from './updateNft';
import {
  printNewEditionOperation,
  PrintNewEditionOutput,
  PrintNewEditionSharedInput,
  PrintNewEditionViaInput,
} from './printNewEdition';

export class NftClient {
  constructor(protected readonly metaplex: Metaplex) {}

  findByMint(mint: PublicKey): Promise<Nft> {
    return this.metaplex.operations().execute(findNftByMintOperation(mint));
  }

  findAllByMintList(mints: PublicKey[]): Promise<(Nft | null)[]> {
    return this.metaplex
      .operations()
      .execute(findNftsByMintListOperation(mints));
  }

  findAllByOwner(owner: PublicKey): Promise<Nft[]> {
    return this.metaplex.operations().execute(findNftsByOwnerOperation(owner));
  }

  findAllByCreator(creator: PublicKey, position: number = 1): Promise<Nft[]> {
    return this.metaplex
      .operations()
      .execute(findNftsByCreatorOperation({ creator, position }));
  }

  findAllByCandyMachine(
    candyMachine: PublicKey,
    version?: 1 | 2
  ): Promise<Nft[]> {
    return this.metaplex
      .operations()
      .execute(findNftsByCandyMachineOperation({ candyMachine, version }));
  }

  uploadMetadata(input: UploadMetadataInput): Promise<UploadMetadataOutput> {
    return this.metaplex.operations().execute(uploadMetadataOperation(input));
  }

  async create(input: CreateNftInput): Promise<{ nft: Nft } & CreateNftOutput> {
    const operation = createNftOperation(input);
    const createNftOutput = await this.metaplex.operations().execute(operation);
    const nft = await this.findByMint(createNftOutput.mint.publicKey);

    return { ...createNftOutput, nft };
  }

  async update(
    nft: Nft,
    input: Omit<UpdateNftInput, 'nft'>
  ): Promise<{ nft: Nft } & UpdateNftOutput> {
    const operation = updateNftOperation({ ...input, nft });
    const updateNftOutput = await this.metaplex.operations().execute(operation);
    const updatedNft = await this.findByMint(nft.mint);

    return { ...updateNftOutput, nft: updatedNft };
  }

  async printNewEdition(
    originalMint: PublicKey,
    input: Omit<PrintNewEditionSharedInput, 'originalMint'> &
      PrintNewEditionViaInput = {}
  ): Promise<{ nft: Nft } & PrintNewEditionOutput> {
    const operation = printNewEditionOperation({ originalMint, ...input });
    const printNewEditionOutput = await this.metaplex
      .operations()
      .execute(operation);
    const nft = await this.findByMint(printNewEditionOutput.mint.publicKey);

    return { ...printNewEditionOutput, nft };
  }
}
