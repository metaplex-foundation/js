import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { createMintToInstruction } from '@solana/spl-token';
import type { Metaplex } from '@/Metaplex';
import {
  isSigner,
  KeypairSigner,
  Operation,
  OperationHandler,
  Signer,
  SplTokenAmount,
  toPublicKey,
  useOperation,
} from '@/types';
import { TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { isMint, Mint } from './Mint';
import { TokenProgram } from './program';
import { findAssociatedTokenAccountPda } from './pdas';

// -----------------
// Operation
// -----------------

const Key = 'MintTokensOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const mintTokensOperation = useOperation<MintTokensOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type MintTokensOperation = Operation<
  typeof Key,
  MintTokensInput,
  MintTokensOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type MintTokensInput = {
  mint: PublicKey | Mint;
  amount: SplTokenAmount;
  toOwner?: PublicKey; // Defaults to mx.identity().
  toToken?: PublicKey | Signer; // Defaults to associated account.
  mintAuthority?: PublicKey | Signer; // Defaults to mx.identity().
  multiSigners?: KeypairSigner[]; // Defaults to [].
  payer?: Signer; // Only used to create missing token accounts. Defaults to mx.identity().
  tokenProgram?: PublicKey; // Defaults to Token Program.
  associatedTokenProgram?: PublicKey; // Defaults to Associated Token Program.
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type MintTokensOutput = {
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const mintTokensOperationHandler: OperationHandler<MintTokensOperation> =
  {
    async handle(
      operation: MintTokensOperation,
      metaplex: Metaplex
    ): Promise<MintTokensOutput> {
      const builder = await mintTokensBuilder(metaplex, operation.input);
      return builder.sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type MintTokensBuilderParams = Omit<
  MintTokensInput,
  'confirmOptions'
> & {
  toTokenExists?: boolean; // Defaults to false.
  createAssociatedTokenAccountInstructionKey?: string;
  createAccountInstructionKey?: string;
  initializeTokenInstructionKey?: string;
  mintTokensInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const mintTokensBuilder = async (
  metaplex: Metaplex,
  params: MintTokensBuilderParams
): Promise<TransactionBuilder> => {
  const {
    mint,
    amount,
    toOwner = metaplex.identity().publicKey,
    toToken,
    mintAuthority = metaplex.identity(),
    multiSigners = [],
    payer = metaplex.identity(),
    tokenProgram = TokenProgram.publicKey,
  } = params;

  const [mintAuthorityPublicKey, signers] = isSigner(mintAuthority)
    ? [mintAuthority.publicKey, [mintAuthority]]
    : [mintAuthority, multiSigners];

  const mintAddress = isMint(mint) ? mint.address : mint;
  const destination =
    toToken ?? findAssociatedTokenAccountPda(mintAddress, toOwner);

  return (
    TransactionBuilder.make()

      // Create token account if missing.
      .add(
        !(params.toTokenExists ?? false)
          ? await metaplex
              .tokens()
              .builders()
              .createTokenIfMissing({
                ...params,
                mint: mintAddress,
                owner: toOwner,
                token: toToken,
                payer,
                tokenVariable: 'toToken',
              })
          : TransactionBuilder.make()
      )

      // Mint tokens.
      .add({
        instruction: createMintToInstruction(
          mintAddress,
          toPublicKey(destination),
          mintAuthorityPublicKey,
          amount.basisPoints.toNumber(),
          multiSigners,
          tokenProgram
        ),
        signers,
        key: params.mintTokensInstructionKey ?? 'mintTokens',
      })
  );
};
