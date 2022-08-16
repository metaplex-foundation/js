import type { Metaplex } from '@/Metaplex';
import { token } from '@/types';
import { PartialKeys, Task } from '@/utils';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey } from '@solana/web3.js';
import { SendTokensInput } from '../tokenModule';
import { toMintAddress } from './helpers';
import { Nft, NftWithToken, Sft, SftWithToken } from './models';
import { NftBuildersClient } from './NftBuildersClient';
import {
  ApproveNftCollectionAuthorityInput,
  approveNftCollectionAuthorityOperation,
  ApproveNftUseAuthorityInput,
  approveNftUseAuthorityOperation,
  CreateNftInput,
  createNftOperation,
  CreateSftInput,
  createSftOperation,
  DeleteNftInput,
  deleteNftOperation,
  FindNftByMetadataInput,
  findNftByMetadataOperation,
  FindNftByMintInput,
  findNftByMintOperation,
  FindNftByTokenInput,
  findNftByTokenOperation,
  FindNftsByCreatorInput,
  findNftsByCreatorOperation,
  FindNftsByMintListInput,
  findNftsByMintListOperation,
  FindNftsByOwnerInput,
  findNftsByOwnerOperation,
  FindNftsByUpdateAuthorityInput,
  findNftsByUpdateAuthorityOperation,
  FreezeDelegatedNftInput,
  freezeDelegatedNftOperation,
  LoadMetadataInput,
  loadMetadataOperation,
  MigrateToSizedCollectionNftInput,
  migrateToSizedCollectionNftOperation,
  PrintNewEditionInput,
  printNewEditionOperation,
  RevokeNftCollectionAuthorityInput,
  revokeNftCollectionAuthorityOperation,
  RevokeNftUseAuthorityInput,
  revokeNftUseAuthorityOperation,
  ThawDelegatedNftInput,
  thawDelegatedNftOperation,
  UnverifyNftCollectionInput,
  unverifyNftCollectionOperation,
  UnverifyNftCreatorInput,
  unverifyNftCreatorOperation,
  UpdateNftInput,
  updateNftOperation,
  UploadMetadataInput,
  uploadMetadataOperation,
  UseNftInput,
  useNftOperation,
  VerifyNftCollectionInput,
  verifyNftCollectionOperation,
  VerifyNftCreatorInput,
  verifyNftCreatorOperation,
} from './operations';

/**
 * @group Modules
 */
export class NftClient {
  constructor(protected readonly metaplex: Metaplex) {}

  builders() {
    return new NftBuildersClient(this.metaplex);
  }

  // -----------------
  // Queries
  // -----------------

  /** {@inheritDoc findNftByMintOperation} */
  findByMint(input: FindNftByMintInput) {
    return this.metaplex.operations().getTask(findNftByMintOperation(input));
  }

  /** {@inheritDoc findNftByMetadataOperation} */
  findByMetadata(input: FindNftByMetadataInput) {
    return this.metaplex
      .operations()
      .getTask(findNftByMetadataOperation(input));
  }

  /** {@inheritDoc findNftByTokenOperation} */
  findByToken(input: FindNftByTokenInput) {
    return this.metaplex.operations().getTask(findNftByTokenOperation(input));
  }

  /** {@inheritDoc findNftsByCreatorOperation} */
  findAllByCreator(input: FindNftsByCreatorInput) {
    return this.metaplex
      .operations()
      .getTask(findNftsByCreatorOperation(input));
  }

  /** {@inheritDoc findNftsByMintListOperation} */
  findAllByMintList(input: FindNftsByMintListInput) {
    return this.metaplex
      .operations()
      .getTask(findNftsByMintListOperation(input));
  }

  /** {@inheritDoc findNftsByOwnerOperation} */
  findAllByOwner(input: FindNftsByOwnerInput) {
    return this.metaplex.operations().getTask(findNftsByOwnerOperation(input));
  }

  /** {@inheritDoc findNftsByUpdateAuthorityOperation} */
  findAllByUpdateAuthority(input: FindNftsByUpdateAuthorityInput) {
    return this.metaplex
      .operations()
      .getTask(findNftsByUpdateAuthorityOperation(input));
  }

  /** {@inheritDoc loadMetadataOperation} */
  load(input: LoadMetadataInput) {
    return this.metaplex.operations().getTask(loadMetadataOperation(input));
  }

  /**
   * Helper method that refetches a given model
   * and returns an instance of the same type.
   */
  refresh<
    T extends Nft | Sft | NftWithToken | SftWithToken | Metadata | PublicKey
  >(
    model: T,
    input?: Omit<
      FindNftByMintInput,
      'mintAddress' | 'tokenAddres' | 'tokenOwner'
    >
  ): Task<T extends Metadata | PublicKey ? Nft | Sft : T> {
    return this.findByMint({
      mintAddress: toMintAddress(model),
      tokenAddress: 'token' in model ? model.token.address : undefined,
      ...input,
    }) as Task<T extends Metadata | PublicKey ? Nft | Sft : T>;
  }

  // -----------------
  // Create, Update and Delete
  // -----------------

  /** {@inheritDoc createNftOperation} */
  create(input: CreateNftInput) {
    return this.metaplex.operations().getTask(createNftOperation(input));
  }

  /** {@inheritDoc createSftOperation} */
  createSft(input: CreateSftInput) {
    return this.metaplex.operations().getTask(createSftOperation(input));
  }

  /** {@inheritDoc printNewEditionOperation} */
  printNewEdition(input: PrintNewEditionInput) {
    return this.metaplex.operations().getTask(printNewEditionOperation(input));
  }

  /** {@inheritDoc uploadMetadataOperation} */
  uploadMetadata(input: UploadMetadataInput) {
    return this.metaplex.operations().getTask(uploadMetadataOperation(input));
  }

  /** {@inheritDoc updateNftOperation} */
  update(input: UpdateNftInput) {
    return this.metaplex.operations().getTask(updateNftOperation(input));
  }

  /** {@inheritDoc deleteNftOperation} */
  delete(input: DeleteNftInput) {
    return this.metaplex.operations().getTask(deleteNftOperation(input));
  }

  // -----------------
  // Use
  // -----------------

  /** {@inheritDoc useNftOperation} */
  use(input: UseNftInput) {
    return this.metaplex.operations().getTask(useNftOperation(input));
  }

  /** {@inheritDoc approveNftUseAuthorityOperation} */
  approveUseAuthority(input: ApproveNftUseAuthorityInput) {
    return this.metaplex
      .operations()
      .getTask(approveNftUseAuthorityOperation(input));
  }

  /** {@inheritDoc revokeNftUseAuthorityOperation} */
  revokeUseAuthority(input: RevokeNftUseAuthorityInput) {
    return this.metaplex
      .operations()
      .getTask(revokeNftUseAuthorityOperation(input));
  }

  // -----------------
  // Creators
  // -----------------

  /** {@inheritDoc verifyNftCreatorOperation} */
  verifyCreator(input: VerifyNftCreatorInput) {
    return this.metaplex.operations().getTask(verifyNftCreatorOperation(input));
  }

  /** {@inheritDoc unverifyNftCreatorOperation} */
  unverifyCreator(input: UnverifyNftCreatorInput) {
    return this.metaplex
      .operations()
      .getTask(unverifyNftCreatorOperation(input));
  }

  // -----------------
  // Collections
  // -----------------

  /** {@inheritDoc verifyNftCollectionOperation} */
  verifyCollection(input: VerifyNftCollectionInput) {
    return this.metaplex
      .operations()
      .getTask(verifyNftCollectionOperation(input));
  }

  /** {@inheritDoc unverifyNftCollectionOperation} */
  unverifyCollection(input: UnverifyNftCollectionInput) {
    return this.metaplex
      .operations()
      .getTask(unverifyNftCollectionOperation(input));
  }

  /** {@inheritDoc approveNftCollectionAuthorityOperation} */
  approveCollectionAuthority(input: ApproveNftCollectionAuthorityInput) {
    return this.metaplex
      .operations()
      .getTask(approveNftCollectionAuthorityOperation(input));
  }

  /** {@inheritDoc revokeNftCollectionAuthorityOperation} */
  revokeCollectionAuthority(input: RevokeNftCollectionAuthorityInput) {
    return this.metaplex
      .operations()
      .getTask(revokeNftCollectionAuthorityOperation(input));
  }

  /** {@inheritDoc migrateToSizedCollectionNftOperation} */
  migrateToSizedCollection(input: MigrateToSizedCollectionNftInput) {
    return this.metaplex
      .operations()
      .getTask(migrateToSizedCollectionNftOperation(input));
  }

  // -----------------
  // Tokens
  // -----------------

  /** {@inheritDoc freezeDelegatedNftOperation} */
  freezeDelegatedNft(input: FreezeDelegatedNftInput) {
    return this.metaplex
      .operations()
      .getTask(freezeDelegatedNftOperation(input));
  }

  /** {@inheritDoc thawDelegatedNftOperation} */
  thawDelegatedNft(input: ThawDelegatedNftInput) {
    return this.metaplex.operations().getTask(thawDelegatedNftOperation(input));
  }

  /** {@inheritDoc sendTokensOperation} */
  send(input: PartialKeys<SendTokensInput, 'amount'>) {
    return this.metaplex.tokens().send({
      ...input,
      amount: token(1),
    });
  }
}
