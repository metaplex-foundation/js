import { Commitment, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { findMasterEditionV2Pda, findMetadataPda } from './pdas';
import {
  parseOriginalOrPrintEditionAccount,
  toMetadataAccount,
} from './accounts';
import { Operation, useOperation, OperationHandler } from '@/types';
import { DisposableScope } from '@/utils';
import { Nft, NftWithToken, toNft, toNftWithToken } from './Nft';
import { toMetadata } from './Metadata';
import { toNftEdition } from './NftEdition';
import {
  TokenAddressOrOwner,
  toMint,
  toMintAccount,
  toToken,
  toTokenAccount,
  toTokenAddress,
} from '../tokenModule';
import { Sft, SftWithToken, toSft, toSftWithToken } from './Sft';

// -----------------
// Operation
// -----------------

const Key = 'FindNftByMintOperation' as const;
export const findNftByMintOperation = useOperation<FindNftByMintOperation>(Key);
export type FindNftByMintOperation = Operation<
  typeof Key,
  FindNftByMintInput,
  FindNftByMintOutput
>;

export type FindNftByMintInput = {
  mint: PublicKey;
  token?: TokenAddressOrOwner;
  loadJsonMetadata?: boolean;
  commitment?: Commitment;
};

export type FindNftByMintOutput = Nft | Sft | NftWithToken | SftWithToken;

// -----------------
// Handler
// -----------------

export const findNftByMintOperationHandler: OperationHandler<FindNftByMintOperation> =
  {
    handle: async (
      operation: FindNftByMintOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<FindNftByMintOutput> => {
      const {
        mint: mintAddress,
        token: tokenAddressOrOwner,
        loadJsonMetadata = true,
        commitment,
      } = operation.input;
      const accountAddresses = [
        mintAddress,
        findMetadataPda(mintAddress),
        findMasterEditionV2Pda(mintAddress),
        tokenAddressOrOwner
          ? toTokenAddress(mintAddress, tokenAddressOrOwner)
          : null,
      ].filter((address): address is PublicKey => !!address);

      const accounts = await metaplex
        .rpc()
        .getMultipleAccounts(accountAddresses, commitment);
      scope.throwIfCanceled();

      const mint = toMint(toMintAccount(accounts[0]));
      let metadata = toMetadata(toMetadataAccount(accounts[1]));
      const editionAccount = parseOriginalOrPrintEditionAccount(accounts[2]);
      const token = accounts[3] ? toToken(toTokenAccount(accounts[3])) : null;

      if (loadJsonMetadata) {
        metadata = await metaplex.nfts().loadMetadata(metadata).run(scope);
        scope.throwIfCanceled();
      }

      const isNft =
        editionAccount.exists &&
        mint.mintAuthorityAddress &&
        mint.mintAuthorityAddress.equals(editionAccount.publicKey);

      if (isNft) {
        const edition = toNftEdition(editionAccount);
        return token
          ? toNftWithToken(metadata, mint, edition, token)
          : toNft(metadata, mint, edition);
      }

      return token
        ? toSftWithToken(metadata, mint, token)
        : toSft(metadata, mint);
    },
  };
