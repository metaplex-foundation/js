import type { Metaplex } from '@/Metaplex';
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

/**
 * @group Module Builders
 */
export class NftBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  // -----------------
  // Create, Update and Delete
  // -----------------

  /** {@inheritDoc createNftBuilder} */
  create(input: CreateNftBuilderParams) {
    return createNftBuilder(this.metaplex, input);
  }

  /** {@inheritDoc createSftBuilder} */
  createSft(input: CreateSftBuilderParams) {
    return createSftBuilder(this.metaplex, input);
  }

  /** {@inheritDoc printNewEditionBuilder} */
  printNewEdition(input: PrintNewEditionBuilderParams) {
    return printNewEditionBuilder(this.metaplex, input);
  }

  /** {@inheritDoc updateNftBuilder} */
  update(input: UpdateNftBuilderParams) {
    return updateNftBuilder(this.metaplex, input);
  }

  /** {@inheritDoc deleteNftBuilder} */
  delete(input: DeleteNftBuilderParams) {
    return deleteNftBuilder(this.metaplex, input);
  }

  // -----------------
  // Use
  // -----------------

  /** {@inheritDoc useNftBuilder} */
  use(input: UseNftBuilderParams) {
    return useNftBuilder(this.metaplex, input);
  }

  /** {@inheritDoc approveNftUseAuthorityBuilder} */
  approveUseAuthority(input: ApproveNftUseAuthorityBuilderParams) {
    return approveNftUseAuthorityBuilder(this.metaplex, input);
  }

  /** {@inheritDoc revokeNftUseAuthorityBuilder} */
  revokeUseAuthority(input: RevokeNftUseAuthorityBuilderParams) {
    return revokeNftUseAuthorityBuilder(this.metaplex, input);
  }

  // -----------------
  // Creators
  // -----------------

  /** {@inheritDoc verifyNftCreatorBuilder} */
  verifyCreator(input: VerifyNftCreatorBuilderParams) {
    return verifyNftCreatorBuilder(this.metaplex, input);
  }

  /** {@inheritDoc unverifyNftCreatorBuilder} */
  unverifyCreator(input: UnverifyNftCreatorBuilderParams) {
    return unverifyNftCreatorBuilder(this.metaplex, input);
  }

  // -----------------
  // Collections
  // -----------------

  /** {@inheritDoc verifyNftCollectionBuilder} */
  verifyCollection(input: VerifyNftCollectionBuilderParams) {
    return verifyNftCollectionBuilder(this.metaplex, input);
  }

  /** {@inheritDoc unverifyNftCollectionBuilder} */
  unverifyCollection(input: UnverifyNftCollectionBuilderParams) {
    return unverifyNftCollectionBuilder(this.metaplex, input);
  }

  /** {@inheritDoc approveNftCollectionAuthorityBuilder} */
  approveCollectionAuthority(
    input: ApproveNftCollectionAuthorityBuilderParams
  ) {
    return approveNftCollectionAuthorityBuilder(this.metaplex, input);
  }

  /** {@inheritDoc revokeNftCollectionAuthorityBuilder} */
  revokeCollectionAuthority(input: RevokeNftCollectionAuthorityBuilderParams) {
    return revokeNftCollectionAuthorityBuilder(this.metaplex, input);
  }

  /** {@inheritDoc migrateToSizedCollectionNftBuilder} */
  migrateToSizedCollection(input: MigrateToSizedCollectionNftBuilderParams) {
    return migrateToSizedCollectionNftBuilder(this.metaplex, input);
  }

  // -----------------
  // Token
  // -----------------

  /** {@inheritDoc freezeDelegatedNftBuilder} */
  freezeDelegatedNft(input: FreezeDelegatedNftBuilderParams) {
    return freezeDelegatedNftBuilder(this.metaplex, input);
  }

  /** {@inheritDoc thawDelegatedNftBuilder} */
  thawDelegatedNft(input: ThawDelegatedNftBuilderParams) {
    return thawDelegatedNftBuilder(this.metaplex, input);
  }
}
