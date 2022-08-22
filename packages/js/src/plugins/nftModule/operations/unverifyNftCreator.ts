import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { TransactionBuilder } from '@/utils';
import { createRemoveCreatorVerificationInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findMetadataPda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'UnverifyNftCreatorOperation' as const;

/**
 * Unverifies the creator of an NFT or SFT.
 *
 * ```ts
 * await metaplex
 *   .nfts()
 *   .unverifyCreator({ mintAddress, creator })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const unverifyNftCreatorOperation =
  useOperation<UnverifyNftCreatorOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type UnverifyNftCreatorOperation = Operation<
  typeof Key,
  UnverifyNftCreatorInput,
  UnverifyNftCreatorOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type UnverifyNftCreatorInput = {
  /** The address of the mint account. */
  mintAddress: PublicKey;

  /**
   * The creator of the NFT or SFT as a Signer.
   *
   * @defaultValue `metaplex.identity()`
   */
  creator?: Signer;

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type UnverifyNftCreatorOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const unverifyNftCreatorOperationHandler: OperationHandler<UnverifyNftCreatorOperation> =
  {
    handle: async (
      operation: UnverifyNftCreatorOperation,
      metaplex: Metaplex
    ): Promise<UnverifyNftCreatorOutput> => {
      return unverifyNftCreatorBuilder(
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
export type UnverifyNftCreatorBuilderParams = Omit<
  UnverifyNftCreatorInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that unverifies the creator. */
  instructionKey?: string;
};

/**
 * Unverifies the creator of an NFT or SFT.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .unverifyCreator({ mintAddress, creator });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const unverifyNftCreatorBuilder = (
  metaplex: Metaplex,
  params: UnverifyNftCreatorBuilderParams
): TransactionBuilder => {
  const { mintAddress, creator = metaplex.identity() } = params;

  return (
    TransactionBuilder.make()

      // Verify the creator.
      .add({
        instruction: createRemoveCreatorVerificationInstruction({
          metadata: findMetadataPda(mintAddress),
          creator: creator.publicKey,
        }),
        signers: [creator],
        key: params.instructionKey ?? 'unverifyCreator',
      })
  );
};
