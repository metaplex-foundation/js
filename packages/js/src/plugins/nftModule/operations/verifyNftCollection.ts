import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { TransactionBuilder } from '@/utils';
import {
  createVerifyCollectionInstruction,
  createVerifySizedCollectionItemInstruction,
} from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import {
  findCollectionAuthorityRecordPda,
  findMasterEditionV2Pda,
  findMetadataPda,
} from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'VerifyNftCollectionOperation' as const;

/**
 * Verifies the collection of an NFT or SFT.
 *
 * ```ts
 * await metaplex
 *   .nfts()
 *   .verifyCollection({ mintAddress, collectionMintAddress })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const verifyNftCollectionOperation =
  useOperation<VerifyNftCollectionOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type VerifyNftCollectionOperation = Operation<
  typeof Key,
  VerifyNftCollectionInput,
  VerifyNftCollectionOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type VerifyNftCollectionInput = {
  /** The address of the mint account. */
  mintAddress: PublicKey;

  /** The mint address of the collection NFT. */
  collectionMintAddress: PublicKey;

  /**
   * An authority that can verify and unverify collection items
   * from the provided `collectionMintAddress`.
   *
   * @defaultValue `metaplex.identity()`
   */
  collectionAuthority?: Signer;

  /**
   * The Signer paying for the transaction fee.
   *
   * @defaultValue `metaplex.identity()`
   */
  payer?: Signer;

  /**
   * Whether or not the provided `collectionMintAddress` is a
   * sized collection (as opposed to a legacy collection).
   *
   * @defaultValue `true`
   */
  isSizedCollection?: boolean;

  /**
   * Whether or not the provided `collectionAuthority` is a delegated
   * collection authority, i.e. it was approved by the update authority
   * using `metaplex.nfts().approveCollectionAuthority()`.
   *
   * @defaultValue `false`
   */
  isDelegated?: boolean;

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type VerifyNftCollectionOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const verifyNftCollectionOperationHandler: OperationHandler<VerifyNftCollectionOperation> =
  {
    handle: async (
      operation: VerifyNftCollectionOperation,
      metaplex: Metaplex
    ): Promise<VerifyNftCollectionOutput> => {
      return verifyNftCollectionBuilder(
        metaplex,
        operation.input
      ).sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type VerifyNftCollectionBuilderParams = Omit<
  VerifyNftCollectionInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that verifies the collection. */
  instructionKey?: string;
};

/**
 * Verifies the collection of an NFT or SFT.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .verifyCollection({ mintAddress, collectionMintAddress });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const verifyNftCollectionBuilder = (
  metaplex: Metaplex,
  params: VerifyNftCollectionBuilderParams
): TransactionBuilder => {
  const {
    mintAddress,
    collectionMintAddress,
    isSizedCollection = true,
    isDelegated = false,
    collectionAuthority = metaplex.identity(),
    payer = metaplex.identity(),
  } = params;

  const accounts = {
    metadata: findMetadataPda(mintAddress),
    collectionAuthority: collectionAuthority.publicKey,
    payer: payer.publicKey,
    collectionMint: collectionMintAddress,
    collection: findMetadataPda(collectionMintAddress),
    collectionMasterEditionAccount: findMasterEditionV2Pda(
      collectionMintAddress
    ),
  };

  const instruction = isSizedCollection
    ? createVerifySizedCollectionItemInstruction(accounts)
    : createVerifyCollectionInstruction(accounts);

  if (isDelegated) {
    instruction.keys.push({
      pubkey: findCollectionAuthorityRecordPda(
        collectionMintAddress,
        collectionAuthority.publicKey
      ),
      isWritable: false,
      isSigner: false,
    });
  }

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)

      // Verify the collection.
      .add({
        instruction: instruction,
        signers: [payer, collectionAuthority],
        key: params.instructionKey ?? 'verifyCollection',
      })
  );
};
