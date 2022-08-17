import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope } from '@/utils';
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
import {
  JsonMetadata,
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
import { findMasterEditionV2Pda, findMetadataPda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'FindNftByMintOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const findNftByMintOperation = useOperation<FindNftByMintOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindNftByMintOperation = Operation<
  typeof Key,
  FindNftByMintInput,
  FindNftByMintOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindNftByMintInput = {
  mintAddress: PublicKey;
  tokenAddress?: PublicKey;
  tokenOwner?: PublicKey;
  loadJsonMetadata?: boolean;
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Outputs
 */
export type FindNftByMintOutput = Nft | Sft | NftWithToken | SftWithToken;

/**
 * @group Operations
 * @category Handlers
 */
export const findNftByMintOperationHandler: OperationHandler<FindNftByMintOperation> =
  {
    handle: async (
      operation: FindNftByMintOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<FindNftByMintOutput> => {
      const {
        mintAddress,
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
