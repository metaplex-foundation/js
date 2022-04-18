import { Metaplex } from '@/Metaplex';
import { MetadataAccount } from '@/programs';
import { GmaBuilder, OperationHandler } from '@/shared';
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
      const metadataInfos = await GmaBuilder.make(metaplex.connection, metadataPdas).get();

      return metadataInfos.map((metadataInfo) => {
        if (!metadataInfo || !metadataInfo.exists) return null;

        try {
          const metadata = MetadataAccount.fromAccountInfo(metadataInfo);
          return new Nft(metadata, metaplex);
        } catch (error) {
          return null;
        }
      });
    },
  };
