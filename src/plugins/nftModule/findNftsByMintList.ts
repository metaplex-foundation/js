import { PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { MetadataAccount } from '@/programs';
import { Operation, OperationHandler, useOperation } from '@/types';
import { GmaBuilder, zipMap } from '@/utils';
import { Nft } from './Nft';

const Key = 'FindNftsByMintListOperation' as const;
export const findNftsByMintListOperation = useOperation<FindNftsByMintListOperation>(Key);
export type FindNftsByMintListOperation = Operation<typeof Key, PublicKey[], (Nft | null)[]>;

export const findNftsByMintListOnChainOperationHandler: OperationHandler<FindNftsByMintListOperation> =
  {
    handle: async (
      operation: FindNftsByMintListOperation,
      metaplex: Metaplex
    ): Promise<(Nft | null)[]> => {
      const mints = operation.input;
      const metadataPdas = await Promise.all(mints.map((mint) => MetadataAccount.pda(mint)));
      const metadataInfos = await GmaBuilder.make(metaplex, metadataPdas).get();

      return zipMap(metadataPdas, metadataInfos, (metadataPda, metadataInfo) => {
        if (!metadataInfo || !metadataInfo.exists) return null;

        try {
          const metadata = MetadataAccount.from(metadataInfo);
          return new Nft(metadata, metaplex);
        } catch (error) {
          return null;
        }
      });
    },
  };
