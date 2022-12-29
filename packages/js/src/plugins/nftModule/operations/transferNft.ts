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

const Key = 'TransferNftOperation' as const;

/**
 * Transfers an NFT or SFT from one account to another.
 *
 * ```ts
 * await metaplex.nfts().transfer({ mintAddress });
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const transferNftOperation = useOperation<TransferNftOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type TransferNftOperation = Operation<
  typeof Key,
  TransferNftInput,
  TransferNftOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type TransferNftInput = {
  /** The address of the mint account. */
  mintAddress: PublicKey;
};

/**
 * @group Operations
 * @category Outputs
 */
export type TransferNftOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const transferNftOperationHandler: OperationHandler<TransferNftOperation> =
  {
    handle: async (
      operation: TransferNftOperation,
      metaplex: Metaplex,
      scope: OperationScope
    ): Promise<TransferNftOutput> => {
      return transferNftBuilder(
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
export type TransferNftBuilderParams = Omit<
  TransferNftInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that uses the NFT. */
  instructionKey?: string;
};

/**
 * Transfers an NFT or SFT from one account to another.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .transfer({ mintAddress });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const transferNftBuilder = (
  metaplex: Metaplex,
  params: TransferNftBuilderParams,
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
        key: params.instructionKey ?? 'transferNft',
      })
  );
};
