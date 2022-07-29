import { PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { Task } from '@/utils';
import { Metadata } from './Metadata';
import { assertNftWithToken, Nft, NftWithToken } from './Nft';
import { assertSft, Sft, SftWithToken } from './Sft';
import {
  CreateNftInput,
  createNftOperation,
  CreateNftOutput,
} from './createNft';
import {
  CreateSftInput,
  createSftOperation,
  CreateSftOutput,
} from './createSft';
import {
  FindNftByMetadataInput,
  findNftByMetadataOperation,
  FindNftByMetadataOutput,
} from './findNftByMetadata';
import {
  FindNftByMintInput,
  findNftByMintOperation,
  FindNftByMintOutput,
} from './findNftByMint';
import {
  FindNftByTokenInput,
  findNftByTokenOperation,
  FindNftByTokenOutput,
} from './findNftByToken';
import {
  FindNftsByMintListInput,
  findNftsByMintListOperation,
} from './findNftsByMintList';
import {
  FindNftsByOwnerInput,
  findNftsByOwnerOperation,
} from './findNftsByOwner';
import {
  FindNftsByUpdateAuthorityInput,
  findNftsByUpdateAuthorityOperation,
} from './findNftsByUpdateAuthority';
import {
  FindNftsByCreatorInput,
  findNftsByCreatorOperation,
} from './findNftsByCreator';
import {
  LoadMetadataInput,
  loadMetadataOperation,
  LoadMetadataOutput,
} from './loadMetadata';
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
import { LoadNftInput, loadNftOperation } from './loadNft';
import { NftBuildersClient } from './NftBuildersClient';
import { UseNftInput, useNftOperation, UseNftOutput } from './useNft';
import {
  AddMetadataInput,
  addMetadataOperation,
  AddMetadataOutput,
} from './addMetadata';

export class NftClient {
  constructor(protected readonly metaplex: Metaplex) {}

  addMetadata(
    input: AddMetadataInput
  ): Task<AddMetadataOutput & { mintWithMetadata: MintWithMetadata }> {
    return new Task(async (scope) => {
      const operation = addMetadataOperation(input);
      const output = await this.metaplex.operations().execute(operation, scope);
      scope.throwIfCanceled();
      const mintWithMetadata = await this.findMintWithMetadataByAddress(
        input.mint
      ).run(scope);
      assertMintWithMetadata(mintWithMetadata);
      return { ...output, mintWithMetadata };
    });
  }

  builders() {
    return new NftBuildersClient(this.metaplex);
  }

  create(input: CreateNftInput): Task<CreateNftOutput & { nft: NftWithToken }> {
    return new Task(async (scope) => {
      const operation = createNftOperation(input);
      const output = await this.metaplex.operations().execute(operation, scope);
      scope.throwIfCanceled();
      const nft = await this.findByMint(output.mintAddress, {
        tokenAddress: output.tokenAddress,
        commitment: input.confirmOptions?.commitment,
      }).run(scope);
      assertNftWithToken(nft);
      return { ...output, nft };
    });
  }

  createSft(
    input: CreateSftInput
  ): Task<CreateSftOutput & { sft: Sft | SftWithToken }> {
    return new Task(async (scope) => {
      const operation = createSftOperation(input);
      const output = await this.metaplex.operations().execute(operation, scope);
      scope.throwIfCanceled();
      const sft = await this.findByMint(output.mintAddress, {
        tokenAddress: output.tokenAddress ?? undefined,
        commitment: input.confirmOptions?.commitment,
      }).run(scope);
      assertSft(sft);
      return { ...output, sft };
    });
  }

  findByMetadata(
    metadata: PublicKey,
    options?: Omit<FindNftByMetadataInput, 'metadata'>
  ): Task<FindNftByMetadataOutput> {
    return this.metaplex
      .operations()
      .getTask(findNftByMetadataOperation({ metadata, ...options }));
  }

  findByMint(
    mint: PublicKey,
    options?: Omit<FindNftByMintInput, 'mint'>
  ): Task<FindNftByMintOutput> {
    return this.metaplex
      .operations()
      .getTask(findNftByMintOperation({ mint, ...options }));
  }

  findByToken(
    token: PublicKey,
    options?: Omit<FindNftByTokenInput, 'Token'>
  ): Task<FindNftByTokenOutput> {
    return this.metaplex
      .operations()
      .getTask(findNftByTokenOperation({ token, ...options }));
  }

  findAllByCreator(
    creator: PublicKey,
    options?: Omit<FindNftsByCreatorInput, 'creator'>
  ) {
    return this.metaplex
      .operations()
      .getTask(findNftsByCreatorOperation({ creator, ...options }));
  }

  findAllByMintList(
    mints: PublicKey[],
    options?: Omit<FindNftsByMintListInput, 'mints'>
  ) {
    return this.metaplex
      .operations()
      .getTask(findNftsByMintListOperation({ mints, ...options }));
  }

  findAllByOwner(
    owner: PublicKey,
    options?: Omit<FindNftsByOwnerInput, 'owner'>
  ) {
    return this.metaplex
      .operations()
      .getTask(findNftsByOwnerOperation({ owner, ...options }));
  }

  findAllByUpdateAuthority(
    updateAuthority: PublicKey,
    options?: Omit<FindNftsByUpdateAuthorityInput, 'updateAuthority'>
  ) {
    return this.metaplex
      .operations()
      .getTask(
        findNftsByUpdateAuthorityOperation({ updateAuthority, ...options })
      );
  }

  loadMetadata(
    metadata: Metadata,
    options?: Omit<LoadMetadataInput, 'metadata'>
  ): Task<LoadMetadataOutput> {
    return this.metaplex
      .operations()
      .getTask(loadMetadataOperation({ metadata }));
  }

  load(
    metadata: Metadata,
    options: Omit<LoadNftInput, 'nft'> = {}
  ): Task<LoadNftOutput> {
    return this.metaplex
      .operations()
      .getTask(loadNftOperation({ metadata, ...options }));
  }

  printNewEdition(
    originalNft: Nft | LazyNft | PublicKey,
    input: Omit<PrintNewEditionSharedInput, 'originalNft'> &
      PrintNewEditionViaInput = {}
  ): Task<PrintNewEditionOutput & { nft: Nft }> {
    return new Task(async (scope) => {
      const operation = printNewEditionOperation({ originalNft, ...input });
      const output = await this.metaplex.operations().execute(operation, scope);
      scope.throwIfCanceled();
      const nft = await this.findByMint(output.mintSigner.publicKey).run(scope);
      return { ...output, nft };
    });
  }

  uploadMetadata(input: UploadMetadataInput): Task<UploadMetadataOutput> {
    return this.metaplex.operations().getTask(uploadMetadataOperation(input));
  }

  update<T extends Nft | Sft | NftWithToken | SftWithToken>(
    nftOrSft: T,
    input: Omit<UpdateNftInput, 'nftOrSft'>
  ): Task<UpdateNftOutput & { nftOrSft: T }> {
    return new Task(async (scope) => {
      const operation = updateNftOperation({ ...input, nftOrSft });
      const output = await this.metaplex.operations().execute(operation, scope);
      scope.throwIfCanceled();
      const updatedNft = await this.findByMint(nftOrSft.address, {
        tokenAddress: 'token' in nftOrSft ? nftOrSft.token.address : undefined,
      }).run(scope);
      return { ...output, nftOrSft: updatedNft as T };
    });
  }

  use(
    nft: Nft | Sft | PublicKey,
    input: Omit<UseNftInput, 'nft'> = {}
  ): Task<UseNftOutput & { nft: Nft }> {
    return new Task(async (scope) => {
      const operation = useNftOperation({ ...input, nft });
      const output = await this.metaplex.operations().execute(operation, scope);
      scope.throwIfCanceled();
      const updatedNft = await this.findByMint(output.mintAddress).run(scope);
      return { ...output, nft: updatedNft };
    });
  }
}
