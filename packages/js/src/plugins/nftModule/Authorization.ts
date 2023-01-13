import {
  AuthorityType,
  AuthorizationData,
} from '@metaplex-foundation/mpl-token-metadata';
import { TokenDelegateInput } from './DelegateInput';
import { Signer, PublicKey, Program } from '@/types';
import { Option } from '@/utils';
import { UnreachableCaseError } from '@/errors';
import { MetadataDelegateInput, Metaplex } from '@/index';

/**
 * Defines an authority that can handle a digital asset (NFT, SFT, etc.).
 *
 * An authority can be one of the following:
 * - Metadata: the update authority of the metadata account.
 * - Holder: the owner of the token account, i.e. the owner of the asset.
 * - Metadata Delegate: an approved delegate authority of the metadata account for a given action.
 * - Token Delegate: an approved delegate authority of the token account for a given action.
 */
export type TokenMetadataAuthority =
  | TokenMetadataAuthorityMetadata
  | TokenMetadataAuthorityHolder
  | TokenMetadataAuthorityMetadataDelegate
  | TokenMetadataAuthorityTokenDelegate;

/** The update authority of the metadata account. */
export type TokenMetadataAuthorityMetadata = {
  __kind: 'metadata';
  updateAuthority: Signer;
};

/** An approved delegate authority of the metadata account for a given action. */
export type TokenMetadataAuthorityMetadataDelegate =
  MetadataDelegateInput<Signer> & {
    __kind: 'metadataDelegate';
  };

/** An approved delegate authority of the token account for a given action. */
export type TokenMetadataAuthorityTokenDelegate = TokenDelegateInput<Signer> & {
  __kind: 'tokenDelegate';
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
    /** The authority that will sign the transaction. */
    authority: PublicKey;
    /**
     * If "holder" or "token delegate" authority,
     * the address of the token account.
     */
    token?: PublicKey;
    /**
     * If "delegate" authority, the address of the update
     * authority or the token owner depending on the type.
     */
    approver?: PublicKey;
    /**
     * If "delegate" authority, the address of the token record
     * or the metdata delegate record PDA depending on the type.
     */
    delegateRecord?: PublicKey;
    /** If any auth rules are provided, the address of the auth rule account. */
    authorizationRules?: PublicKey;
  };
  signers: Signer[];
  data: {
    authorityType: AuthorityType;
    authorizationData: Option<AuthorizationData>;
  };
};

export const parseTokenMetadataAuthorization = (
  metaplex: Metaplex,
  input: {
    mint: PublicKey;
    authority: TokenMetadataAuthority;
    authorizationDetails?: TokenMetadataAuthorizationDetails;
    programs?: Program[];
  }
): ParsedTokenMetadataAuthorization => {
  const auth = {
    accounts: {},
    signers: [] as Signer[],
    data: { authorizationData: input.authorizationDetails?.data ?? null },
  } as ParsedTokenMetadataAuthorization;

  if (input.authority.__kind === 'metadata') {
    auth.accounts.authority = input.authority.updateAuthority.publicKey;
    auth.signers.push(input.authority.updateAuthority);
    auth.data.authorityType = AuthorityType.Metadata;
  } else if (input.authority.__kind === 'metadataDelegate') {
    auth.accounts.authority = input.authority.delegate.publicKey;
    auth.accounts.delegateRecord = metaplex
      .nfts()
      .pdas()
      .metadataDelegateRecord({
        mint: input.mint,
        type: input.authority.type,
        updateAuthority: input.authority.updateAuthority,
        delegate: input.authority.delegate.publicKey,
        programs: input.programs,
      });
    auth.accounts.approver = input.authority.updateAuthority;
    auth.signers.push(input.authority.delegate);
    auth.data.authorityType = AuthorityType.Delegate;
  } else if (input.authority.__kind === 'tokenDelegate') {
    auth.accounts.authority = input.authority.delegate.publicKey;
    auth.accounts.token = metaplex.tokens().pdas().associatedTokenAccount({
      mint: input.mint,
      owner: input.authority.owner,
      programs: input.programs,
    });
    auth.accounts.delegateRecord = metaplex.nfts().pdas().tokenRecord({
      mint: input.mint,
      type: input.authority.type,
      owner: input.authority.owner,
      programs: input.programs,
    });
    auth.accounts.approver = input.authority.owner;
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

export const getSignerFromTokenMetadataAuthority = (
  authority: TokenMetadataAuthority | Signer
): Signer => {
  if (!('__kind' in authority)) {
    return authority;
  }

  switch (authority.__kind) {
    case 'metadata':
      return authority.updateAuthority;
    case 'metadataDelegate':
    case 'tokenDelegate':
      return authority.delegate;
    case 'holder':
      return authority.owner;
    default:
      throw new UnreachableCaseError((authority as any).__kind as never);
  }
};
