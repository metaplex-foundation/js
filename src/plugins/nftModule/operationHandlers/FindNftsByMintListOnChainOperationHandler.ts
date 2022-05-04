import { Metaplex } from '@/Metaplex';
import { MetadataAccount } from '@/programs';
import { GmaBuilder } from '@/types';
import { OperationHandler } from '@/types';
import { zipMap } from '@/utils';
import { Nft } from '../models';
import { FindNftsByMintListOperation } from '../operations/findNftsByMintListOperation';

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
