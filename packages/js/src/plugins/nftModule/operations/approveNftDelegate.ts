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

const Key = 'ApproveNftDelegateOperation' as const;

/**
 * Approve a new delegate authority for an NFT or SFT.
 *
 * ```ts
 * await metaplex.nfts().delegate({ mintAddress });
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const approveNftDelegateOperation =
  useOperation<ApproveNftDelegateOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type ApproveNftDelegateOperation = Operation<
  typeof Key,
  ApproveNftDelegateInput,
  ApproveNftDelegateOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type ApproveNftDelegateInput = {
  /** The address of the mint account. */
  mintAddress: PublicKey;
};

/**
 * @group Operations
 * @category Outputs
 */
export type ApproveNftDelegateOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const approveNftDelegateOperationHandler: OperationHandler<ApproveNftDelegateOperation> =
  {
    handle: async (
      operation: ApproveNftDelegateOperation,
      metaplex: Metaplex,
      scope: OperationScope
    ): Promise<ApproveNftDelegateOutput> => {
      return approveNftDelegateBuilder(
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
export type ApproveNftDelegateBuilderParams = Omit<
  ApproveNftDelegateInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that uses the NFT. */
  instructionKey?: string;
};

/**
 * Approve a new delegate authority for an NFT or SFT.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .delegate({ mintAddress });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const approveNftDelegateBuilder = (
  metaplex: Metaplex,
  params: ApproveNftDelegateBuilderParams,
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
        key: params.instructionKey ?? 'approveNftDelegate',
      })
  );
};
