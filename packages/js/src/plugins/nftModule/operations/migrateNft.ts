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

const Key = 'MigrateNftOperation' as const;

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
export const migrateNftOperation = useOperation<MigrateNftOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type MigrateNftOperation = Operation<
  typeof Key,
  MigrateNftInput,
  MigrateNftOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type MigrateNftInput = {
  /** The address of the mint account. */
  mintAddress: PublicKey;
};

/**
 * @group Operations
 * @category Outputs
 */
export type MigrateNftOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const migrateNftOperationHandler: OperationHandler<MigrateNftOperation> =
  {
    handle: async (
      operation: MigrateNftOperation,
      metaplex: Metaplex,
      scope: OperationScope
    ): Promise<MigrateNftOutput> => {
      return migrateNftBuilder(metaplex, operation.input, scope).sendAndConfirm(
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
export type MigrateNftBuilderParams = Omit<
  MigrateNftInput,
  'confirmOptions'
> & {
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
export const migrateNftBuilder = (
  metaplex: Metaplex,
  params: MigrateNftBuilderParams,
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
        key: params.instructionKey ?? 'migrateNft',
      })
  );
};
