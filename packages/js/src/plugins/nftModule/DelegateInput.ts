import {
  DelegateArgs,
  DelegateRole,
} from '@metaplex-foundation/mpl-token-metadata';
import { UnreachableCaseError } from '@/errors';
import { DelegateRoleRequiredDataError, Metaplex } from '@/index';
import { isSigner, Program, PublicKey, Signer } from '@/types';

export { DelegateRole };

export type DelegateInputSigner = DelegateInput<Signer>;
export type DelegateInput<T extends PublicKey | Signer = PublicKey> =
  | {
      role:
        | DelegateRole.Authority
        | DelegateRole.Collection
        | DelegateRole.Use
        | DelegateRole.Update;
      delegate: T;
      updateAuthority: PublicKey;
    }
  | {
      role: DelegateRole.Transfer | DelegateRole.Utility | DelegateRole.Sale;
      delegate: T;
      owner: PublicKey;
    };

export const parseTokenMetadataDelegateInput = <
  T extends PublicKey | Signer = PublicKey
>(
  metaplex: Metaplex,
  mint: PublicKey,
  record: DelegateInput<T>,
  programs?: Program[]
): {
  delegate: T;
  namespace: PublicKey;
  delegateRecord: PublicKey;
} => {
  switch (record.role) {
    case DelegateRole.Authority:
    case DelegateRole.Collection:
    case DelegateRole.Use:
    case DelegateRole.Update:
      return {
        delegate: record.delegate,
        namespace: record.updateAuthority,
        delegateRecord: metaplex
          .nfts()
          .pdas()
          .delegateRecord({
            mint,
            role: record.role,
            namespace: record.updateAuthority,
            delegate: isSigner(record.delegate)
              ? record.delegate.publicKey
              : record.delegate,
            programs,
          }),
      };
    case DelegateRole.Transfer:
    case DelegateRole.Utility:
    case DelegateRole.Sale:
      return {
        delegate: record.delegate,
        namespace: record.owner,
        delegateRecord: metaplex.nfts().pdas().persistentDelegateRecord({
          mint,
          owner: record.owner,
          programs,
        }),
      };
    default:
      throw new UnreachableCaseError((record as any).role as never);
  }
};

export type DelegateRoleSeed =
  | 'authority_delegate'
  | 'collection_delegate'
  | 'use_delegate'
  | 'update_delegate'
  | 'persistent_delegate';

export const getDelegateRoleSeed = (role: DelegateRole): DelegateRoleSeed => {
  switch (role) {
    case DelegateRole.Authority:
      return 'authority_delegate';
    case DelegateRole.Collection:
      return 'collection_delegate';
    case DelegateRole.Use:
      return 'use_delegate';
    case DelegateRole.Update:
      return 'update_delegate';
    case DelegateRole.Transfer:
    case DelegateRole.Utility:
    case DelegateRole.Sale:
      return 'persistent_delegate';
    default:
      throw new UnreachableCaseError(role);
  }
};

export const getDelegateRoleDefaultData = (
  role: DelegateRole
): DelegateArgs => {
  switch (role) {
    case DelegateRole.Authority:
      throw new DelegateRoleRequiredDataError('Authority');
    case DelegateRole.Collection:
      return { __kind: 'CollectionV1' };
    case DelegateRole.Use:
      throw new DelegateRoleRequiredDataError('Use');
    case DelegateRole.Update:
      throw new DelegateRoleRequiredDataError('Update');
    case DelegateRole.Transfer:
      throw new DelegateRoleRequiredDataError('Transfer');
    case DelegateRole.Sale:
      throw new DelegateRoleRequiredDataError('Sale');
    case DelegateRole.Utility:
      throw new DelegateRoleRequiredDataError('Utility');
    default:
      throw new UnreachableCaseError(role);
  }
};
