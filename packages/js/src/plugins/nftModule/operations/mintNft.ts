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

const Key = 'MintNftOperation' as const;

/**
 * Mint token(s) for an NFT or SFT.
 *
 * ```ts
 * await metaplex.nfts().mint({ mintAddress });
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const mintNftOperation = useOperation<MintNftOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type MintNftOperation = Operation<
  typeof Key,
  MintNftInput,
  MintNftOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type MintNftInput = {
  /** The address of the mint account. */
  mintAddress: PublicKey;
};

/**
 * @group Operations
 * @category Outputs
 */
export type MintNftOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const mintNftOperationHandler: OperationHandler<MintNftOperation> = {
  handle: async (
    operation: MintNftOperation,
    metaplex: Metaplex,
    scope: OperationScope
  ): Promise<MintNftOutput> => {
    return mintNftBuilder(metaplex, operation.input, scope).sendAndConfirm(
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
export type MintNftBuilderParams = Omit<MintNftInput, 'confirmOptions'> & {
  /** A key to distinguish the instruction that uses the NFT. */
  instructionKey?: string;
};

/**
 * Mint token(s) for an NFT or SFT.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .mint({ mintAddress });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const mintNftBuilder = (
  metaplex: Metaplex,
  params: MintNftBuilderParams,
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
        key: params.instructionKey ?? 'mintNft',
      })
  );
};
