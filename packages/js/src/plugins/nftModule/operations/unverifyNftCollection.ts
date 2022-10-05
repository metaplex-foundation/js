import {
  createUnverifyCollectionInstruction,
  createUnverifySizedCollectionItemInstruction,
} from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Metaplex } from '@/Metaplex';
import {
  Operation,
  OperationHandler,
  OperationScope,
  Signer,
  useOperation,
} from '@/types';
import { TransactionBuilder, TransactionBuilderOptions } from '@/utils';

// -----------------
// Operation
// -----------------

const Key = 'UnverifyNftCollectionOperation' as const;

/**
 * Unverifies the collection of an NFT or SFT.
 *
 * ```ts
 * await metaplex
 *   .nfts()
 *   .unverifyCollection({ mintAddress, collectionMintAddress };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const unverifyNftCollectionOperation =
  useOperation<UnverifyNftCollectionOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type UnverifyNftCollectionOperation = Operation<
  typeof Key,
  UnverifyNftCollectionInput,
  UnverifyNftCollectionOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type UnverifyNftCollectionInput = {
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
};

/**
 * @group Operations
 * @category Outputs
 */
export type UnverifyNftCollectionOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const unverifyNftCollectionOperationHandler: OperationHandler<UnverifyNftCollectionOperation> =
  {
    handle: async (
      operation: UnverifyNftCollectionOperation,
      metaplex: Metaplex,
      scope: OperationScope
    ): Promise<UnverifyNftCollectionOutput> => {
      return unverifyNftCollectionBuilder(
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
export type UnverifyNftCollectionBuilderParams = Omit<
  UnverifyNftCollectionInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that unverifies the collection. */
  instructionKey?: string;
};

/**
 * Unverifies the collection of an NFT or SFT.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .unverifyCollection({ mintAddress, collectionMintAddress });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const unverifyNftCollectionBuilder = (
  metaplex: Metaplex,
  params: UnverifyNftCollectionBuilderParams,
  options: TransactionBuilderOptions = {}
): TransactionBuilder => {
  const { programs, payer = metaplex.rpc().getDefaultFeePayer() } = options;
  const {
    mintAddress,
    collectionMintAddress,
    isSizedCollection = true,
    isDelegated = false,
    collectionAuthority = metaplex.identity(),
  } = params;

  // Programs.
  const tokenMetadataProgram = metaplex.programs().getTokenMetadata(programs);

  const accounts = {
    metadata: metaplex.nfts().pdas().metadata({
      mint: mintAddress,
      programs,
    }),
    collectionAuthority: collectionAuthority.publicKey,
    payer: payer.publicKey,
    collectionMint: collectionMintAddress,
    collection: metaplex.nfts().pdas().metadata({
      mint: collectionMintAddress,
      programs,
    }),
    collectionMasterEditionAccount: metaplex.nfts().pdas().masterEdition({
      mint: collectionMintAddress,
      programs,
    }),
    collectionAuthorityRecord: isDelegated
      ? metaplex.nfts().pdas().collectionAuthorityRecord({
          mint: collectionMintAddress,
          collectionAuthority: collectionAuthority.publicKey,
          programs,
        })
      : undefined,
  };

  const instruction = isSizedCollection
    ? createUnverifySizedCollectionItemInstruction(
        accounts,
        tokenMetadataProgram.address
      )
    : createUnverifyCollectionInstruction(
        accounts,
        tokenMetadataProgram.address
      );

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)

      // Unverify the collection.
      .add({
        instruction,
        signers: [payer, collectionAuthority],
        key: params.instructionKey ?? 'unverifyCollection',
      })
  );
};
