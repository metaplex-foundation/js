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

const Key = 'UnlockNftOperation' as const;

/**
 * Migrate an NFT to a new asset class.
 *
 * ```ts
 * await metaplex.nfts().migrate({ mintAddress });
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const unlockNftOperation = useOperation<UnlockNftOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type UnlockNftOperation = Operation<
  typeof Key,
  UnlockNftInput,
  UnlockNftOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type UnlockNftInput = {
  /** The address of the mint account. */
  mintAddress: PublicKey;
};

/**
 * @group Operations
 * @category Outputs
 */
export type UnlockNftOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const unlockNftOperationHandler: OperationHandler<UnlockNftOperation> = {
  handle: async (
    operation: UnlockNftOperation,
    metaplex: Metaplex,
    scope: OperationScope
  ): Promise<UnlockNftOutput> => {
    return unlockNftBuilder(metaplex, operation.input, scope).sendAndConfirm(
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
export type UnlockNftBuilderParams = Omit<UnlockNftInput, 'confirmOptions'> & {
  /** A key to distinguish the instruction that uses the NFT. */
  instructionKey?: string;
};

/**
 * Migrate an NFT to a new asset class.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .migrate({ mintAddress });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const unlockNftBuilder = (
  metaplex: Metaplex,
  params: UnlockNftBuilderParams,
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
        key: params.instructionKey ?? 'unlockNft',
      })
  );
};
