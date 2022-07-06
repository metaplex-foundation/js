import { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { Task } from '@/utils';
import { JsonMetadata } from './JsonMetadata';
import { LazyMetadata, Metadata } from './Metadata';
import { Nft } from './Nft';
import {
  CreateNftInput,
  createNftOperation,
  CreateNftOutput,
} from './createNft';
import {
  FindMintWithMetadataByAddressInput,
  findMintWithMetadataByAddressOperation,
} from './findMintWithMetadataByAddress';
import {
  FindMintWithMetadataByMetadataInput,
  findMintWithMetadataByMetadataOperation,
} from './findMintWithMetadataByMetadata';
import { findNftByMintOperation } from './findNftByMint';
import { findNftsByMintListOperation } from './findNftsByMintList';
import { findNftsByOwnerOperation } from './findNftsByOwner';
import { findNftsByCreatorOperation } from './findNftsByCreator';
import { findNftsByCandyMachineOperation } from './findNftsByCandyMachine';
import {
  FindTokenWithMetadataByAddressInput,
  findTokenWithMetadataByAddressOperation,
} from './findTokenWithMetadataByAddress';
import {
  FindTokenWithMetadataByMetadataInput,
  findTokenWithMetadataByMetadataOperation,
} from './findTokenWithMetadataByMetadata';
import {
  FindTokenWithMetadataByMintInput,
  findTokenWithMetadataByMintOperation,
} from './findTokenWithMetadataByMint';
import {
  printNewEditionOperation,
  PrintNewEditionOutput,
  PrintNewEditionSharedInput,
  PrintNewEditionViaInput,
} from './printNewEdition';
import {
  UploadMetadataInput,
  uploadMetadataOperation,
  UploadMetadataOutput,
} from './uploadMetadata';
import {
  UpdateNftInput,
  updateNftOperation,
  UpdateNftOutput,
} from './updateNft';

export class NftClient {
  constructor(protected readonly metaplex: Metaplex) {}

  create(input: CreateNftInput): Task<CreateNftOutput & { nft: Nft }> {
    return new Task(async (scope) => {
      const operation = createNftOperation(input);
      const output = await this.metaplex.operations().execute(operation, scope);
      scope.throwIfCanceled();
      const nft = await this.findByMint(output.mintSigner.publicKey).run(scope);
      return { ...output, nft };
    });
  }

  findByMint(mint: PublicKey): Task<Nft> {
    return this.metaplex.operations().getTask(findNftByMintOperation(mint));
  }

  findAllByMintList(mints: PublicKey[]): Task<(Nft | null)[]> {
    return this.metaplex
      .operations()
      .getTask(findNftsByMintListOperation(mints));
  }

  findAllByOwner(owner: PublicKey): Task<Nft[]> {
    return this.metaplex.operations().getTask(findNftsByOwnerOperation(owner));
  }

  findAllByCreator(creator: PublicKey, position: number = 1): Task<Nft[]> {
    return this.metaplex
      .operations()
      .getTask(findNftsByCreatorOperation({ creator, position }));
  }

  findAllByCandyMachine(candyMachine: PublicKey, version?: 1 | 2): Task<Nft[]> {
    return this.metaplex
      .operations()
      .getTask(findNftsByCandyMachineOperation({ candyMachine, version }));
  }

  findMintWithMetadataByAddress(
    address: PublicKey,
    options?: Omit<FindMintWithMetadataByAddressInput, 'address'>
  ) {
    return this.metaplex
      .operations()
      .getTask(findMintWithMetadataByAddressOperation({ address, ...options }));
  }

  findMintWithMetadataByMetadata(
    metadataAddress: PublicKey,
    options?: Omit<FindMintWithMetadataByMetadataInput, 'address'>
  ) {
    return this.metaplex
      .operations()
      .getTask(
        findMintWithMetadataByMetadataOperation({ metadataAddress, ...options })
      );
  }

  findTokenWithMetadataByAddress(
    address: PublicKey,
    options?: Omit<FindTokenWithMetadataByAddressInput, 'address'>
  ) {
    return this.metaplex
      .operations()
      .getTask(
        findTokenWithMetadataByAddressOperation({ address, ...options })
      );
  }

  findTokenWithMetadataByMetadata(
    metadataAddress: PublicKey,
    ownerAddress: PublicKey,
    options?: Omit<
      FindTokenWithMetadataByMetadataInput,
      'metadataAddress' | 'ownerAddress'
    >
  ) {
    return this.metaplex.operations().getTask(
      findTokenWithMetadataByMetadataOperation({
        metadataAddress,
        ownerAddress,
        ...options,
      })
    );
  }

  findTokenWithMetadataByMint(
    mintAddress: PublicKey,
    ownerAddress: PublicKey,
    options?: Omit<
      FindTokenWithMetadataByMintInput,
      'metadataAddress' | 'ownerAddress'
    >
  ) {
    return this.metaplex.operations().getTask(
      findTokenWithMetadataByMintOperation({
        mintAddress,
        ownerAddress,
        ...options,
      })
    );
  }

  uploadMetadata(input: UploadMetadataInput): Task<UploadMetadataOutput> {
    return this.metaplex.operations().getTask(uploadMetadataOperation(input));
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

  loadMetadata(metadata: LazyMetadata): Task<Metadata> {
    return new Task(async (scope) => {
      const json = await this.metaplex
        .storage()
        .downloadJson<JsonMetadata>(metadata.uri, scope);
      scope.throwIfCanceled();
      return { ...metadata, lazy: false, json };
    });
  }
}
