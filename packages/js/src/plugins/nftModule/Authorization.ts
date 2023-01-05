import {
  AuthorityType,
  AuthorizationData,
} from '@metaplex-foundation/mpl-token-metadata';
import { Signer, PublicKey } from '@/types';
import { Option } from '@/utils';
import { UnreachableCaseError } from '@/errors';

/**
 * Defines an authority that can handle a digital asset (NFT, SFT, etc.).
 *
 * An authority can be one of the following:
 * - Metadata: the update authority of the metadata account.
 * - Delegate: an approved delegate authority of the metadata account for a given action.
 * - Holder: the owner of the token account, i.e. the owner of the asset.
 */
export type TokenMetadataAuthority =
  | TokenMetadataAuthorityMetadata
  | TokenMetadataAuthorityDelegate
  | TokenMetadataAuthorityHolder;

/** The update authority of the metadata account. */
export type TokenMetadataAuthorityMetadata = {
  __kind: 'metadata';
  updateAuthority: Signer;
};

/** An approved delegate authority of the metadata account for a given action. */
export type TokenMetadataAuthorityDelegate = {
  __kind: 'delegate';
  delegate: Signer;
  delegateRecord: PublicKey;
};

/** The owner of the token account, i.e. the owner of the asset. */
export type TokenMetadataAuthorityHolder = {
  __kind: 'holder';
  owner: Signer;
  token: PublicKey;
};

/**
 * Allows us to provide additional authorization details for an operation.
 *
 * This includes:
 * - The account defining the rules that should be used to authorize the operation.
 * - Optionally, the extra data that should be used by those rules.
 */
export type TokenMetadataAuthorizationDetails = {
  rules: PublicKey;
  data?: AuthorizationData;
};

export type ParsedTokenMetadataAuthorization = {
  accounts: {
    authority: PublicKey;
    token?: PublicKey;
    delegateRecord?: PublicKey;
    authorizationRules?: PublicKey;
  };
  signers: Signer[];
  data: {
    authorityType: AuthorityType;
    authorizationData: Option<AuthorizationData>;
  };
};

export const parseTokenMetadataAuthorization = (input: {
  authority: TokenMetadataAuthority;
  authorizationDetails?: TokenMetadataAuthorizationDetails;
}): ParsedTokenMetadataAuthorization => {
  const auth = {
    accounts: {},
    signers: [] as Signer[],
    data: { authorizationData: input.authorizationDetails?.data ?? null },
  } as ParsedTokenMetadataAuthorization;

  if (input.authority.__kind === 'metadata') {
    auth.accounts.authority = input.authority.updateAuthority.publicKey;
    auth.signers.push(input.authority.updateAuthority);
    auth.data.authorityType = AuthorityType.Metadata;
  } else if (input.authority.__kind === 'delegate') {
    auth.accounts.authority = input.authority.delegate.publicKey;
    auth.accounts.delegateRecord = input.authority.delegateRecord;
    auth.signers.push(input.authority.delegate);
    auth.data.authorityType = AuthorityType.Delegate;
  } else if (input.authority.__kind === 'holder') {
    auth.accounts.authority = input.authority.owner.publicKey;
    auth.accounts.token = input.authority.token;
    auth.signers.push(input.authority.owner);
    auth.data.authorityType = AuthorityType.Holder;
  } else {
    throw new UnreachableCaseError((input.authority as any).__kind as never);
  }

  return auth;
};
