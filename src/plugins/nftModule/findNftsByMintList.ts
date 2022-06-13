import { PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { findMetadataPda, parseMetadataAccount } from '@/programs';
import { Operation, OperationHandler, useOperation } from '@/types';
import { GmaBuilder, zipMap } from '@/utils';
import { Nft } from './Nft';

const Key = 'FindNftsByMintListOperation' as const;
export const findNftsByMintListOperation =
  useOperation<FindNftsByMintListOperation>(Key);
export type FindNftsByMintListOperation = Operation<
  typeof Key,
  PublicKey[],
  (Nft | null)[]
>;

export const findNftsByMintListOnChainOperationHandler: OperationHandler<FindNftsByMintListOperation> =
  {
    handle: async (
      operation: FindNftsByMintListOperation,
      metaplex: Metaplex
    ): Promise<(Nft | null)[]> => {
      const mints = operation.input;
      const metadataPdas = mints.map((mint) => findMetadataPda(mint));
      const metadataInfos = await GmaBuilder.make(metaplex, metadataPdas).get();

      return zipMap(
        metadataPdas,
        metadataInfos,
        (metadataPda, metadataInfo) => {
          if (!metadataInfo || !metadataInfo.exists) return null;

          try {
            const metadata = parseMetadataAccount(metadataInfo);
            return new Nft(metadata, metaplex);
          } catch (error) {
            return null;
          }
        }
      );
    },
  };
