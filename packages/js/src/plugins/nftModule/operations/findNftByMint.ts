import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope, Task } from '@/utils';
import { Commitment, PublicKey } from '@solana/web3.js';
import {
  findAssociatedTokenAccountPda,
  toMint,
  toMintAccount,
  toToken,
  toTokenAccount,
} from '../../tokenModule';
import {
  parseOriginalOrPrintEditionAccount,
  toMetadataAccount,
} from '../accounts';
import { toMintAddress } from '../helpers';
import {
  JsonMetadata,
  Metadata,
  Nft,
  NftWithToken,
  Sft,
  SftWithToken,
  toMetadata,
  toNft,
  toNftEdition,
  toNftWithToken,
  toSft,
  toSftWithToken,
} from '../models';
import type { NftClient } from '../NftClient';
import { findMasterEditionV2Pda, findMetadataPda } from '../pdas';

// -----------------
// Clients
// -----------------

/** @internal */
export function _findNftByMintClient(
  this: NftClient,
  mint: PublicKey,
  options?: Omit<FindNftByMintInput, 'mint'>
) {
  return this.metaplex
    .operations()
    .getTask(findNftByMintOperation({ mint, ...options }));
}

/** @internal */
export function _refreshNftClient<
  T extends Nft | Sft | NftWithToken | SftWithToken | Metadata | PublicKey
>(
  this: NftClient,
  nftOrSft: T,
  options?: Omit<FindNftByMintInput, 'mint' | 'tokenAddres' | 'tokenOwner'>
): Task<T extends Metadata | PublicKey ? Nft | Sft : T> {
  return this.findByMint(toMintAddress(nftOrSft), {
    tokenAddress: 'token' in nftOrSft ? nftOrSft.token.address : undefined,
    ...options,
  }) as Task<T extends Metadata | PublicKey ? Nft | Sft : T>;
}

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
  tokenAddress?: PublicKey;
  tokenOwner?: PublicKey;
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
        tokenAddress,
        tokenOwner,
        loadJsonMetadata = true,
        commitment,
      } = operation.input;

      const associatedTokenAddress = tokenOwner
        ? findAssociatedTokenAccountPda(mintAddress, tokenOwner)
        : undefined;
      const accountAddresses = [
        mintAddress,
        findMetadataPda(mintAddress),
        findMasterEditionV2Pda(mintAddress),
        tokenAddress ?? associatedTokenAddress,
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
        try {
          const json = await metaplex
            .storage()
            .downloadJson<JsonMetadata>(metadata.uri, scope);
          metadata = { ...metadata, jsonLoaded: true, json };
        } catch (error) {
          metadata = { ...metadata, jsonLoaded: true, json: null };
        }
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
