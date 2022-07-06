import { PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { Task } from '@/utils';
import { JsonMetadata } from './JsonMetadata';
import { LazyMetadata, Metadata } from './Metadata';
import { LazyNft, Nft } from './Nft';
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
import { FindNftByMintInput, findNftByMintOperation } from './findNftByMint';
import {
  FindNftsByMintListInput,
  findNftsByMintListOperation,
} from './findNftsByMintList';
import {
  FindNftsByOwnerInput,
  findNftsByOwnerOperation,
} from './findNftsByOwner';
import {
  FindNftsByCreatorInput,
  findNftsByCreatorOperation,
} from './findNftsByCreator';
import {
  FindNftsByCandyMachineInput,
  findNftsByCandyMachineOperation,
} from './findNftsByCandyMachine';
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

  findByMint(
    mint: PublicKey,
    options?: Omit<FindNftByMintInput, 'mint'>
  ): Task<Nft> {
    return this.metaplex
      .operations()
      .getTask(findNftByMintOperation({ mint, ...options }));
  }

  findAllByMintList(
    mints: PublicKey[],
    options?: Omit<FindNftsByMintListInput, 'mints'>
  ): Task<(LazyNft | null)[]> {
    return this.metaplex
      .operations()
      .getTask(findNftsByMintListOperation({ mints, ...options }));
  }

  findAllByOwner(
    owner: PublicKey,
    options?: Omit<FindNftsByOwnerInput, 'owner'>
  ): Task<LazyNft[]> {
    return this.metaplex
      .operations()
      .getTask(findNftsByOwnerOperation({ owner, ...options }));
  }

  findAllByCreator(
    creator: PublicKey,
    options?: Omit<FindNftsByCreatorInput, 'creator'>
  ): Task<LazyNft[]> {
    return this.metaplex
      .operations()
      .getTask(findNftsByCreatorOperation({ creator, ...options }));
  }

  findAllByCandyMachine(
    candyMachine: PublicKey,
    options?: Omit<FindNftsByCandyMachineInput, 'creator'>
  ): Task<LazyNft[]> {
    return this.metaplex
      .operations()
      .getTask(findNftsByCandyMachineOperation({ candyMachine, ...options }));
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
