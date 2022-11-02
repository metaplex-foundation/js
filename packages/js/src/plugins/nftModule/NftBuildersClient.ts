import {
  approveNftCollectionAuthorityBuilder,
  ApproveNftCollectionAuthorityBuilderParams,
  approveNftUseAuthorityBuilder,
  ApproveNftUseAuthorityBuilderParams,
  createNftBuilder,
  CreateNftBuilderParams,
  createSftBuilder,
  CreateSftBuilderParams,
  deleteNftBuilder,
  DeleteNftBuilderParams,
  freezeDelegatedNftBuilder,
  FreezeDelegatedNftBuilderParams,
  migrateToSizedCollectionNftBuilder,
  MigrateToSizedCollectionNftBuilderParams,
  printNewEditionBuilder,
  PrintNewEditionBuilderParams,
  revokeNftCollectionAuthorityBuilder,
  RevokeNftCollectionAuthorityBuilderParams,
  revokeNftUseAuthorityBuilder,
  RevokeNftUseAuthorityBuilderParams,
  thawDelegatedNftBuilder,
  ThawDelegatedNftBuilderParams,
  unverifyNftCollectionBuilder,
  UnverifyNftCollectionBuilderParams,
  unverifyNftCreatorBuilder,
  UnverifyNftCreatorBuilderParams,
  updateNftBuilder,
  UpdateNftBuilderParams,
  useNftBuilder,
  UseNftBuilderParams,
  verifyNftCollectionBuilder,
  VerifyNftCollectionBuilderParams,
  verifyNftCreatorBuilder,
  VerifyNftCreatorBuilderParams,
} from './operations';
import type { Metaplex } from '@/Metaplex';
import { TransactionBuilderOptions } from '@/utils';

/**
 * This client allows you to access the underlying Transaction Builders
 * for the write operations of the NFT module.
 *
 * @see {@link NftClient}
 * @group Module Builders
 * */
export class NftBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  // -----------------
  // Create, Update and Delete
  // -----------------

  /** {@inheritDoc createNftBuilder} */
  create(input: CreateNftBuilderParams, options?: TransactionBuilderOptions) {
    return createNftBuilder(this.metaplex, input, options);
  }

  /** {@inheritDoc createSftBuilder} */
  createSft(
    input: CreateSftBuilderParams,
    options?: TransactionBuilderOptions
  ) {
    return createSftBuilder(this.metaplex, input, options);
  }

  /** {@inheritDoc printNewEditionBuilder} */
  printNewEdition(
    input: PrintNewEditionBuilderParams,
    options?: TransactionBuilderOptions
  ) {
    return printNewEditionBuilder(this.metaplex, input, options);
  }

  /** {@inheritDoc updateNftBuilder} */
  update(input: UpdateNftBuilderParams, options?: TransactionBuilderOptions) {
    return updateNftBuilder(this.metaplex, input, options);
  }

  /** {@inheritDoc deleteNftBuilder} */
  delete(input: DeleteNftBuilderParams, options?: TransactionBuilderOptions) {
    return deleteNftBuilder(this.metaplex, input, options);
  }

  // -----------------
  // Use
  // -----------------

  /** {@inheritDoc useNftBuilder} */
  use(input: UseNftBuilderParams, options?: TransactionBuilderOptions) {
    return useNftBuilder(this.metaplex, input, options);
  }

  /** {@inheritDoc approveNftUseAuthorityBuilder} */
  approveUseAuthority(
    input: ApproveNftUseAuthorityBuilderParams,
    options?: TransactionBuilderOptions
  ) {
    return approveNftUseAuthorityBuilder(this.metaplex, input, options);
  }

  /** {@inheritDoc revokeNftUseAuthorityBuilder} */
  revokeUseAuthority(
    input: RevokeNftUseAuthorityBuilderParams,
    options?: TransactionBuilderOptions
  ) {
    return revokeNftUseAuthorityBuilder(this.metaplex, input, options);
  }

  // -----------------
  // Creators
  // -----------------

  /** {@inheritDoc verifyNftCreatorBuilder} */
  verifyCreator(
    input: VerifyNftCreatorBuilderParams,
    options?: TransactionBuilderOptions
  ) {
    return verifyNftCreatorBuilder(this.metaplex, input, options);
  }

  /** {@inheritDoc unverifyNftCreatorBuilder} */
  unverifyCreator(
    input: UnverifyNftCreatorBuilderParams,
    options?: TransactionBuilderOptions
  ) {
    return unverifyNftCreatorBuilder(this.metaplex, input, options);
  }

  // -----------------
  // Collections
  // -----------------

  /** {@inheritDoc verifyNftCollectionBuilder} */
  verifyCollection(
    input: VerifyNftCollectionBuilderParams,
    options?: TransactionBuilderOptions
  ) {
    return verifyNftCollectionBuilder(this.metaplex, input, options);
  }

  /** {@inheritDoc unverifyNftCollectionBuilder} */
  unverifyCollection(
    input: UnverifyNftCollectionBuilderParams,
    options?: TransactionBuilderOptions
  ) {
    return unverifyNftCollectionBuilder(this.metaplex, input, options);
  }

  /** {@inheritDoc approveNftCollectionAuthorityBuilder} */
  approveCollectionAuthority(
    input: ApproveNftCollectionAuthorityBuilderParams,
    options?: TransactionBuilderOptions
  ) {
    return approveNftCollectionAuthorityBuilder(this.metaplex, input, options);
  }

  /** {@inheritDoc revokeNftCollectionAuthorityBuilder} */
  revokeCollectionAuthority(
    input: RevokeNftCollectionAuthorityBuilderParams,
    options?: TransactionBuilderOptions
  ) {
    return revokeNftCollectionAuthorityBuilder(this.metaplex, input, options);
  }

  /** {@inheritDoc migrateToSizedCollectionNftBuilder} */
  migrateToSizedCollection(
    input: MigrateToSizedCollectionNftBuilderParams,
    options?: TransactionBuilderOptions
  ) {
    return migrateToSizedCollectionNftBuilder(this.metaplex, input, options);
  }

  // -----------------
  // Token
  // -----------------

  /** {@inheritDoc freezeDelegatedNftBuilder} */
  freezeDelegatedNft(
    input: FreezeDelegatedNftBuilderParams,
    options?: TransactionBuilderOptions
  ) {
    return freezeDelegatedNftBuilder(this.metaplex, input, options);
  }

  /** {@inheritDoc thawDelegatedNftBuilder} */
  thawDelegatedNft(
    input: ThawDelegatedNftBuilderParams,
    options?: TransactionBuilderOptions
  ) {
    return thawDelegatedNftBuilder(this.metaplex, input, options);
  }
}
