import { PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import {
  findMasterEditionV2Pda,
  findMetadataPda,
  toMetadataAccount,
  toOriginalOrPrintEditionAccount,
} from '@/programs';
import { Operation, useOperation, OperationHandler } from '@/types';
import { Nft, toNft } from './Nft';
import { toMetadata } from './Metadata';
import { toNftEdition } from './NftEdition';
import { toMint, toMintAccount } from '../tokenModule';

// -----------------
// Operation
// -----------------

const Key = 'FindNftByMintOperation' as const;
export const findNftByMintOperation = useOperation<FindNftByMintOperation>(Key);
export type FindNftByMintOperation = Operation<typeof Key, PublicKey, Nft>;

// -----------------
// Handler
// -----------------

export const findNftByMintOnChainOperationHandler: OperationHandler<FindNftByMintOperation> =
  {
    handle: async (
      operation: FindNftByMintOperation,
      metaplex: Metaplex
    ): Promise<Nft> => {
      const mint = operation.input;
      const accounts = await metaplex
        .rpc()
        .getMultipleAccounts([
          mint,
          findMetadataPda(mint),
          findMasterEditionV2Pda(mint),
        ]);

      const mintAccount = toMintAccount(accounts[0]);
      const metadataAccount = toMetadataAccount(accounts[1]);
      const editionAccount = toOriginalOrPrintEditionAccount(accounts[2]);

      return toNft(
        toMetadata(metadataAccount),
        toMint(mintAccount),
        toNftEdition(editionAccount)
      );
    },
  };
