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

const Key = 'RevokeNftDelegateOperation' as const;

/**
 * Revoke an existing delegate authority for an NFT or SFT.
 *
 * ```ts
 * await metaplex.nfts().revoke({ mintAddress });
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const revokeNftDelegateOperation =
  useOperation<RevokeNftDelegateOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type RevokeNftDelegateOperation = Operation<
  typeof Key,
  RevokeNftDelegateInput,
  RevokeNftDelegateOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type RevokeNftDelegateInput = {
  /** The address of the mint account. */
  mintAddress: PublicKey;
};

/**
 * @group Operations
 * @category Outputs
 */
export type RevokeNftDelegateOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const revokeNftDelegateOperationHandler: OperationHandler<RevokeNftDelegateOperation> =
  {
    handle: async (
      operation: RevokeNftDelegateOperation,
      metaplex: Metaplex,
      scope: OperationScope
    ): Promise<RevokeNftDelegateOutput> => {
      return revokeNftDelegateBuilder(
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
export type RevokeNftDelegateBuilderParams = Omit<
  RevokeNftDelegateInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that uses the NFT. */
  instructionKey?: string;
};

/**
 * Revoke an existing delegate authority for an NFT or SFT.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .revoke({ mintAddress });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const revokeNftDelegateBuilder = (
  metaplex: Metaplex,
  params: RevokeNftDelegateBuilderParams,
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
        key: params.instructionKey ?? 'revokeNftDelegate',
      })
  );
};
