import { HolderDelegateType, MetadataDelegateType } from './DelegateType';
import { UnreachableCaseError } from '@/errors';
import { Metaplex } from '@/index';
import { isSigner, Program, PublicKey, Signer } from '@/types';

export type DelegateInputSigner = DelegateInput<Signer>;
export type DelegateInput<T extends PublicKey | Signer = PublicKey> =
  | {
      type: MetadataDelegateType;
      delegate: T;
      updateAuthority: PublicKey;
    }
  | {
      type: HolderDelegateType;
      delegate: T;
      owner: PublicKey;
    };

export const parseTokenMetadataDelegateInput = <
  T extends PublicKey | Signer = PublicKey
>(
  metaplex: Metaplex,
  mint: PublicKey,
  input: DelegateInput<T>,
  programs?: Program[]
): {
  delegate: T;
  namespace: PublicKey;
  delegateRecord: PublicKey;
} => {
  switch (input.type) {
    case 'AuthorityV1':
    case 'CollectionV1':
    case 'UseV1':
    case 'UpdateV1':
      return {
        delegate: input.delegate,
        namespace: input.updateAuthority,
        delegateRecord: metaplex
          .nfts()
          .pdas()
          .delegateRecord({
            mint,
            type: input.type,
            namespace: input.updateAuthority,
            delegate: isSigner(input.delegate)
              ? input.delegate.publicKey
              : input.delegate,
            programs,
          }),
      };
    case 'TransferV1':
    case 'UtilityV1':
    case 'SaleV1':
      return {
        delegate: input.delegate,
        namespace: input.owner,
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
