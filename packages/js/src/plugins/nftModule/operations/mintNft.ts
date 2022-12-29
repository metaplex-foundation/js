import { createMintInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js';
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
  const ataProgram = metaplex.programs().getAssociatedToken(programs);
  const tokenProgram = metaplex.programs().getToken(programs);
  const systemProgram = metaplex.programs().getSystem(programs);

  // PDAs.
  const metadata = metaplex.nfts().pdas().metadata({
    mint: mintAddress,
    programs,
  });
  const masterEdition = metaplex.nfts().pdas().masterEdition({
    mint: mintAddress,
    programs,
  });

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)

      // Update the metadata account.
      .add({
        instruction: createMintInstruction(
          {
            token: web3.PublicKey, // TODO
            metadata,
            masterEdition,
            mint: mintAddress,
            payer: payer.publicKey,
            authority: web3.PublicKey, // TODO
            systemProgram: systemProgram.address,
            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            splTokenProgram: tokenProgram.address,
            splAtaProgram: ataProgram.address,
            authorizationRules: web3.PublicKey, // TODO
          },
          {
            mintArgs: {
              __kind: 'V1',
              amount: 0, // TODO: beet.bignum;
              authorizationData: null, // TODO: beet.COption<AuthorizationData>;
            },
          },
          tokenMetadataProgram.address
        ),
        signers: [payer],
        key: params.instructionKey ?? 'mintNft',
      })
  );
};
