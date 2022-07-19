import { Commitment, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { parseMetadataAccount } from './accounts';
import { findMetadataPda } from './pdas';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope, GmaBuilder, zipMap } from '@/utils';
import { LazyNft, Nft, toLazyNft } from './Nft';
import { toLazyMetadata } from './Metadata';

// -----------------
// Operation
// -----------------

const Key = 'FindNftsByMintListOperation' as const;
export const findNftsByMintListOperation =
  useOperation<FindNftsByMintListOperation>(Key);
export type FindNftsByMintListOperation = Operation<
  typeof Key,
  FindNftsByMintListInput,
  (LazyNft | Nft | null)[]
>;

export type FindNftsByMintListInput = {
  mints: PublicKey[];
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

export const findNftsByMintListOperationHandler: OperationHandler<FindNftsByMintListOperation> =
  {
    handle: async (
      operation: FindNftsByMintListOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const { mints, commitment } = operation.input;
      const metadataPdas = mints.map((mint) => findMetadataPda(mint));
      const metadataInfos = await GmaBuilder.make(metaplex, metadataPdas, {
        commitment,
      }).get();
      scope.throwIfCanceled();

      return zipMap(
        metadataPdas,
        metadataInfos,
        (metadataPda, metadataInfo) => {
          if (!metadataInfo || !metadataInfo.exists) return null;

          try {
            const metadata = parseMetadataAccount(metadataInfo);
            return toLazyNft(toLazyMetadata(metadata));
          } catch (error) {
            return null;
          }
        }
      );
    },
  };
