import type { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { DisposableScope, Option, TransactionBuilder } from '@/utils';
import { createInitializeMintInstruction, MINT_SIZE } from '@solana/spl-token';
import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { Mint } from './Mint';
import { TokenProgram } from './program';

// -----------------
// Operation
// -----------------

const Key = 'CreateMintOperation' as const;
export const createMintOperation = useOperation<CreateMintOperation>(Key);
export type CreateMintOperation = Operation<
  typeof Key,
  CreateMintInput,
  CreateMintOutput
>;

export type CreateMintInput = {
  decimals?: number; // Defaults to 0 decimals.
  mint?: Signer; // Defaults to new generated Keypair.
  payer?: Signer; // Defaults to mx.identity().
  mintAuthority?: PublicKey; // Defaults to mx.identity().
  freezeAuthority?: Option<PublicKey>; // Defaults to mintAuthority.
  tokenProgram?: PublicKey; // Defaults to System Program.
  confirmOptions?: ConfirmOptions;
};

export type CreateMintOutput = {
  response: SendAndConfirmTransactionResponse;
  mintSigner: Signer;
  mint: Mint;
};

export const createMintOperationHandler: OperationHandler<CreateMintOperation> =
  {
    async handle(
      operation: CreateMintOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<CreateMintOutput> {
      const builder = await createMintBuilder(metaplex, operation.input);
      scope.throwIfCanceled();

      const output = await builder.sendAndConfirm(
        metaplex,
        operation.input.confirmOptions
      );
      scope.throwIfCanceled();

      const mint = await metaplex
        .tokens()
        .findMintByAddress({ address: output.mintSigner.publicKey })
        .run(scope);

      return { ...output, mint };
    },
  };

// -----------------
// Builder
// -----------------

export type CreateMintBuilderParams = Omit<
  CreateMintInput,
  'confirmOptions'
> & {
  createAccountInstructionKey?: string;
  initializeMintInstructionKey?: string;
};

export type CreateMintBuilderContext = Omit<
  CreateMintOutput,
  'response' | 'mint'
>;

export const createMintBuilder = async (
  metaplex: Metaplex,
  params: CreateMintBuilderParams
): Promise<TransactionBuilder<CreateMintBuilderContext>> => {
  const {
    decimals = 0,
    mint = Keypair.generate(),
    payer = metaplex.identity(),
    mintAuthority = metaplex.identity().publicKey,
    freezeAuthority = mintAuthority,
    tokenProgram = TokenProgram.publicKey,
  } = params;

  return (
    TransactionBuilder.make<CreateMintBuilderContext>()
      .setFeePayer(payer)
      .setContext({ mintSigner: mint })

      // Create an empty account for the mint.
      .add(
        await metaplex
          .system()
          .builders()
          .createAccount({
            payer,
            newAccount: mint,
            space: MINT_SIZE,
            program: tokenProgram,
            instructionKey:
              params.createAccountInstructionKey ?? 'createAccount',
          })
      )

      // Initialize the mint.
      .add({
        instruction: createInitializeMintInstruction(
          mint.publicKey,
          decimals,
          mintAuthority,
          freezeAuthority,
          tokenProgram
        ),
        signers: [mint],
        key: params.initializeMintInstructionKey ?? 'initializeMint',
      })
  );
};
