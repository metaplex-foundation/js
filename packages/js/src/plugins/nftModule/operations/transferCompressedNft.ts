// @ts-nocheck

import { Metaplex } from '@/Metaplex';
import { PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import {
  getSignerFromTokenMetadataAuthority,
  parseTokenMetadataAuthorization,
  TokenMetadataAuthorityHolder,
  TokenMetadataAuthorityTokenDelegate,
  TokenMetadataAuthorizationDetails,
} from '../Authorization';
import { isNonFungible, isProgrammable, Sft } from '../models';
import { Option, TransactionBuilder, TransactionBuilderOptions } from '@/utils';
import {
  GetAssetProofRpcResponse,
  Operation,
  OperationHandler,
  OperationScope,
  Signer,
  SplTokenAmount,
  token,
  useOperation,
} from '@/types';
import type { Metadata } from '@/plugins';
import { TransferNftBuilderParams } from './transferNft';
import {
  createTransferInstruction,
  PROGRAM_ID as BUBBLEGUM_PROGRAM_ID,
} from '@metaplex-foundation/mpl-bubblegum';
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from '@solana/spl-account-compression';
import base58 from 'bs58';

// -----------------
// Operation
// -----------------

const Key = 'TransferCompressedNftOperation' as const;

/**
 * Transfers an NFT or SFT from one account to another.
 *
 * ```ts
 * await metaplex.nfts().transfer({
 *   nftOrSft,
 *   toOwner,
 *   amount: token(5),
 * });
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const transferCompressedNftOperation =
  useOperation<TransferCompressedNftOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type TransferCompressedNftOperation = Operation<
  typeof Key,
  TransferCompressedNftInput,
  TransferCompressedNftOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type TransferCompressedNftInput = {
  /**
   * The NFT or SFT to transfer.
   * We only need its address and token standard.
   */
  nftOrSft: Sft;

  /**
   * An authority allowed to transfer the asset.
   *
   * Note that Metadata authorities are
   * not supported for this instruction.
   *
   * If a `Signer` is provided directly,
   * it will be used as an Holder authority.
   *
   * @see {@link TokenMetadataAuthority}
   * @defaultValue `metaplex.identity()`
   */
  authority?:
    | Signer
    | TokenMetadataAuthorityTokenDelegate
    | TokenMetadataAuthorityHolder;

  /**
   * The authorization rules and data to use for the transfer.
   *
   * @see {@link TokenMetadataAuthorizationDetails}
   * @defaultValue Defaults to not using auth rules.
   */
  authorizationDetails?: TokenMetadataAuthorizationDetails;

  /**
   * The wallet to get the tokens from.
   *
   * @defaultValue The public key of the provided authority.
   */
  fromOwner?: PublicKey;

  /**
   * The token account to be debited.
   *
   * @defaultValue Defaults to the associated token account of `fromOwner`.
   */
  fromToken?: PublicKey;

  /**
   * The wallet to send the tokens to.
   */
  toOwner: PublicKey;

  /**
   * The token account to be credited.
   *
   * @defaultValue Defaults to the associated token account of `toOwner`.
   */
  toToken?: PublicKey;

  /**
   * The amount of tokens to transfer.
   *
   * @defaultValue `token(1)`
   */
  amount?: SplTokenAmount;

  /**
   * The asset proof data from the ReadApi
   */
  compression: GetAssetProofRpcResponse;
};

/**
 * @group Operations
 * @category Outputs
 */
export type TransferCompressedNftOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const transferCompressedNftOperationHandler: OperationHandler<TransferCompressedNftOperation> =
  {
    handle: async (
      operation: TransferCompressedNftOperation,
      metaplex: Metaplex,
      scope: OperationScope
    ): Promise<TransferCompressedNftOutput> => {
      return transferCompressedNftBuilder(
        metaplex,
        operation.input,
        scope
      ).sendAndConfirm(metaplex, scope.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type TransferCompressedNftBuilderParams = Omit<
  TransferCompressedNftInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that uses the NFT. */
  instructionKey?: string;
};

/**
 * Transfers a compressed NFT from one account to another.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .transfer({
 *     nftOrSft,
 *     toOwner,
 *     compression,
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const transferCompressedNftBuilder = (
  metaplex: Metaplex,
  params: TransferCompressedNftBuilderParams,
  options: TransactionBuilderOptions = {}
): TransactionBuilder => {
  const { programs, payer = metaplex.rpc().getDefaultFeePayer() } = options;
  const { nftOrSft, toOwner, compression } = params;

  const merkleTree = new PublicKey(compression.tree_id);

  const [treeAuthority] = PublicKey.findProgramAddressSync(
    [merkleTree.toBuffer()],
    BUBBLEGUM_PROGRAM_ID
  );

  // todo(nick): support different owner/delegate other than the payer
  const leafOwner = payer.publicKey;
  const leafDelegate = payer.publicKey;

  const canopyDepth = nftOrSft.compression?.seq ?? 0;

  // compute the proof hashes to include
  let proofPath =
    compression.proof?.length > 0
      ? compression.proof
          .map((node: string) => ({
            pubkey: new PublicKey(node),
            isSigner: false,
            isWritable: false,
          }))
          .slice(
            0,
            compression.proof.length - (!!canopyDepth ? canopyDepth : 0)
          )
      : undefined;

  console.log('proofPath');
  console.log(proofPath);

  return TransactionBuilder.make()
    .setFeePayer(payer)
    .add({
      instruction: createTransferInstruction(
        {
          treeAuthority,
          merkleTree,
          leafOwner,
          leafDelegate,
          newLeafOwner: toOwner,
          logWrapper: SPL_NOOP_PROGRAM_ID,
          compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
          anchorRemainingAccounts: proofPath,
        },
        {
          root: new PublicKey(compression.root.trim()).toBytes(),
          dataHash: new PublicKey(
            nftOrSft.compression.data_hash.trim()
          ).toBytes(),
          creatorHash: new PublicKey(
            nftOrSft.compression.creator_hash.trim()
          ).toBytes(),
          nonce: nftOrSft.compression?.leaf_id,
          index: nftOrSft.compression?.leaf_id,
        }
      ),
      signers: [payer],
      key: params.instructionKey ?? 'transferCompressedNft',
    });
};

/**
 * Helper function to auto fetch the asset proof data from the ReadApi
 */
export async function prepareTransferCompressedNftBuilder(
  metaplex: Metaplex,
  params: TransferCompressedNftBuilderParams | TransferNftBuilderParams
): Promise<TransferCompressedNftBuilderParams> {
  // auto fetch the asset for its compression data
  // @ts-ignore
  if (!params.nftOrSft?.compression?.data_hash) {
    // todo(nick): auto fetch the asset for the compression data
    console.log('auto fetch the asset by mint');
  }

  // auto fetch the assetProof data from the ReadApi
  if (!params.compression) {
    params.compression = (await metaplex
      .rpc()
      .getAssetProof(params.nftOrSft.address)) as GetAssetProofRpcResponse;
  }

  return params as TransferCompressedNftBuilderParams;
}
