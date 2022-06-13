import { PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import {
  parseMetadataAccount,
  parseOriginalOrPrintEditionAccount,
  findMasterEditionV2Pda,
  findMetadataPda,
} from '@/programs';
import { Operation, useOperation, OperationHandler } from '@/types';
import { NftNotFoundError } from '@/errors';
import { Nft } from './Nft';

const Key = 'FindNftByMintOperation' as const;
export const findNftByMintOperation = useOperation<FindNftByMintOperation>(Key);
export type FindNftByMintOperation = Operation<typeof Key, PublicKey, Nft>;

export const findNftByMintOnChainOperationHandler: OperationHandler<FindNftByMintOperation> =
  {
    handle: async (
      operation: FindNftByMintOperation,
      metaplex: Metaplex
    ): Promise<Nft> => {
      const mint = operation.input;
      const [metadata, edition] = await metaplex
        .rpc()
        .getMultipleAccounts([
          findMetadataPda(mint),
          findMasterEditionV2Pda(mint),
        ]);

      const metadataAccount = parseMetadataAccount(metadata);
      const editionAccount = parseOriginalOrPrintEditionAccount(edition);

      if (!metadataAccount.exists) {
        throw new NftNotFoundError(mint);
      }

      const nft = new Nft(metadataAccount, metaplex);

      try {
        await nft.metadataTask.run();
      } catch (e) {
        // Fail silently...
      }

      nft.editionTask.loadWith(editionAccount.exists ? editionAccount : null);

      return nft;
    },
  };
