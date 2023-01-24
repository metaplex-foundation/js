import { createMintInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Metaplex } from '@/Metaplex';
import {
  Operation,
  OperationHandler,
  OperationScope,
  useOperation,
} from '@/types';
import { TransactionBuilder, TransactionBuilderOptions } from '@/utils';

// -----------------
// Operation
// -----------------

const Key = 'LockNftOperation' as const;

/**
 * Lock a programmable NFT.
 *
 * ```ts
 * await metaplex.nfts().lock({ mintAddress });
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const lockNftOperation = useOperation<LockNftOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type LockNftOperation = Operation<
  typeof Key,
  LockNftInput,
  LockNftOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type LockNftInput = {
  /** The address of the mint account. */
  mintAddress: PublicKey;
};

/**
 * @group Operations
 * @category Outputs
 */
export type LockNftOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const lockNftOperationHandler: OperationHandler<LockNftOperation> = {
  handle: async (
    operation: LockNftOperation,
    metaplex: Metaplex,
    scope: OperationScope
  ): Promise<LockNftOutput> => {
    return lockNftBuilder(metaplex, operation.input, scope).sendAndConfirm(
      metaplex,
      scope.confirmOptions
    );
  },
};

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type LockNftBuilderParams = Omit<LockNftInput, 'confirmOptions'> & {
  /** A key to distinguish the instruction that uses the NFT. */
  instructionKey?: string;
};

/**
 * Lock a programmable NFT.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .lock({ mintAddress });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const lockNftBuilder = (
  metaplex: Metaplex,
  params: LockNftBuilderParams,
  options: TransactionBuilderOptions = {}
): TransactionBuilder => {
  const { programs, payer = metaplex.rpc().getDefaultFeePayer() } = options;
  const { mintAddress } = params;

  // Programs.
  const tokenMetadataProgram = metaplex.programs().getTokenMetadata(programs);

  // PDAs.
  const metadata = metaplex.nfts().pdas().metadata({
    mint: mintAddress,
    programs,
  });

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)

      // Update the metadata account.
      .add({
        instruction: createMintInstruction(
          { metadata } as any, // TODO
          {} as any, // TODO
          tokenMetadataProgram.address
        ),
        signers: [],
        key: params.instructionKey ?? 'lockNft',
      })
  );
};
