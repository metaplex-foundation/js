import { PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { Task } from '@/utils';
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
  FindNftsByUpdateAuthorityInput,
  findNftsByUpdateAuthorityOperation,
} from './findNftsByUpdateAuthority';
import {
  FindNftsByCreatorInput,
  findNftsByCreatorOperation,
} from './findNftsByCreator';
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
import { loadMetadataOperation } from './loadMetadata';
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

export class NftClient {
  constructor(protected readonly metaplex: Metaplex) {}

  builders() {
    return new NftBuildersClient(this.metaplex);
  }

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

  findAllByCreator(
    creator: PublicKey,
    options?: Omit<FindNftsByCreatorInput, 'creator'>
  ) {
    return this.metaplex
      .operations()
      .getTask(findNftsByCreatorOperation({ creator, ...options }));
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
    address: PublicKey,
    options?: Omit<FindMintWithMetadataByMetadataInput, 'address'>
  ) {
    return this.metaplex
      .operations()
      .getTask(
        findMintWithMetadataByMetadataOperation({ address, ...options })
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

  loadMetadata(metadata: LazyMetadata): Task<Metadata> {
    return this.metaplex
      .operations()
      .getTask(loadMetadataOperation({ metadata }));
  }

  loadNft(nft: LazyNft, options: Omit<LoadNftInput, 'nft'> = {}): Task<Nft> {
    return this.metaplex
      .operations()
      .getTask(loadNftOperation({ nft, ...options }));
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

  update(
    nft: Nft | LazyNft,
    input: Omit<UpdateNftInput, 'nft'>
  ): Task<UpdateNftOutput & { nft: Nft }> {
    return new Task(async (scope) => {
      const operation = updateNftOperation({ ...input, nft });
      const output = await this.metaplex.operations().execute(operation, scope);
      scope.throwIfCanceled();
      const updatedNft = await this.findByMint(nft.mintAddress).run(scope);
      return { ...output, nft: updatedNft };
    });
  }

  use(
    nft: Nft | LazyNft | PublicKey,
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
