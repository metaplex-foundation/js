import { DelegateArgs } from '@metaplex-foundation/mpl-token-metadata';
import { HolderDelegateType, MetadataDelegateType } from './DelegateType';
import { UnreachableCaseError } from '@/errors';
import { Metaplex } from '@/index';
import { isSigner, Program, PublicKey, Signer } from '@/types';

type SplitTypeAndData<
  T extends { __kind: any },
  U extends T['__kind'] = any
> = T extends {
  __kind: U;
}
  ? { type: T['__kind']; data?: Omit<T, '__kind' | 'authorizationData'> }
  : never;

export type MetadataDelegateInputWithData<
  T extends PublicKey | Signer = PublicKey
> = {
  delegate: T;
  updateAuthority: PublicKey;
} & SplitTypeAndData<DelegateArgs, MetadataDelegateType>;

export type HolderDelegateInputWithData<
  T extends PublicKey | Signer = PublicKey
> = {
  delegate: T;
  owner: PublicKey;
} & SplitTypeAndData<DelegateArgs, HolderDelegateType>;

export type MetadataDelegateInput<T extends PublicKey | Signer = PublicKey> =
  Omit<MetadataDelegateInputWithData<T>, 'data'>;

export type HolderDelegateInput<T extends PublicKey | Signer = PublicKey> =
  Omit<HolderDelegateInputWithData<T>, 'data'>;

export type DelegateInputSigner = DelegateInput<Signer>;
export type DelegateInput<T extends PublicKey | Signer = PublicKey> =
  | MetadataDelegateInput<T>
  | HolderDelegateInput<T>;

export type DelegateInputWithDataSigner = DelegateInputWithData<Signer>;
export type DelegateInputWithData<T extends PublicKey | Signer = PublicKey> =
  | MetadataDelegateInputWithData<T>
  | HolderDelegateInputWithData<T>;

export const parseTokenMetadataDelegateInput = <
  T extends PublicKey | Signer = PublicKey
>(
  metaplex: Metaplex,
  mint: PublicKey,
  input: DelegateInput<T>,
  programs?: Program[]
): {
  delegate: T;
  approver: PublicKey;
  delegateRecord: PublicKey;
} => {
  switch (input.type) {
    // case 'AuthorityV1':
    // case 'UseV1':
    // case 'UpdateV1':
    case 'CollectionV1':
      return {
        delegate: input.delegate,
        approver: input.updateAuthority,
        delegateRecord: metaplex
          .nfts()
          .pdas()
          .delegateRecord({
            mint,
            type: input.type,
            approver: input.updateAuthority,
            delegate: isSigner(input.delegate)
              ? input.delegate.publicKey
              : input.delegate,
            programs,
          }),
      };
    // case 'UtilityV1':
    case 'TransferV1':
    case 'SaleV1':
      return {
        delegate: input.delegate,
        approver: input.owner,
        delegateRecord: metaplex.nfts().pdas().persistentDelegateRecord({
          mint,
          owner: input.owner,
          programs,
        }),
      };
    default:
      throw new UnreachableCaseError((input as any).type as never);
  }
};
