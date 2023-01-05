import { DelegateRole } from '@metaplex-foundation/mpl-token-metadata';
import { UnreachableCaseError } from '@/errors';
import { isSigner, Program, PublicKey, Signer } from '@/types';
import { Metaplex } from '@/index';

export { DelegateRole };

export type DelegateRecordSigner = DelegateRecord<Signer>;
export type DelegateRecord<T extends PublicKey | Signer = PublicKey> =
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

export const parseTokenMetadataDelegateRecord = <
  T extends PublicKey | Signer = PublicKey
>(
  metaplex: Metaplex,
  mint: PublicKey,
  record: DelegateRecord<T>,
  programs: Program[]
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
