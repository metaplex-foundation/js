import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import {
  Collection,
  Uses,
  createCreateMetadataAccountV2Instruction,
} from '@metaplex-foundation/mpl-token-metadata';
import { Metaplex } from '@/Metaplex';
import {
  useOperation,
  Operation,
  Signer,
  OperationHandler,
  Creator,
  BigNumber,
  toUniformVerifiedCreators,
  toNullCreators,
  SplTokenAmount,
} from '@/types';
import { findMetadataPda } from './pdas';
import { DisposableScope, Option, TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { TokenAddressOrOwner, toTokenAddress } from '../tokenModule';

// -----------------
// Operation
// -----------------

const Key = 'CreateSftOperation' as const;
export const createSftOperation = useOperation<CreateSftOperation>(Key);
export type CreateSftOperation = Operation<
  typeof Key,
  CreateSftInput,
  CreateSftOutput
>;

export interface CreateSftInput {
  // Accounts.
  payer?: Signer; // Defaults to mx.identity().
  mint?: { new: Signer } | { existing: PublicKey }; // Defaults to new generated Keypair.
  token?: TokenAddressOrOwner & { amount: SplTokenAmount }; // Defaults to not creating a token account for the Sft.
  updateAuthority?: Signer; // Defaults to mx.identity().
  mintAuthority?: Signer; // Defaults to mx.identity().
  freezeAuthority?: Option<PublicKey>; // Defaults to mx.identity().

  // Data.
  decimals?: number; // Defaults to 0.
  uri: string;
  name: string;
  sellerFeeBasisPoints: number;
  symbol?: string; // Defaults to an empty string.
  creators?: Creator[]; // Defaults to mx.identity() as a single Creator.
  isMutable?: boolean; // Defaults to true.
  maxSupply?: Option<BigNumber>; // Defaults to 0.
  collection?: Option<Collection>; // Defaults to null.
  uses?: Option<Uses>; // Defaults to null.

  // Programs.
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;

  // Options.
  confirmOptions?: ConfirmOptions;
}

export interface CreateSftOutput {
  response: SendAndConfirmTransactionResponse;
  mintAddress: PublicKey;
  metadataAddress: PublicKey;
  tokenAddress: PublicKey | null;
}

// -----------------
// Handler
// -----------------

export const createSftOperationHandler: OperationHandler<CreateSftOperation> = {
  handle: async (
    operation: CreateSftOperation,
    metaplex: Metaplex,
    scope: DisposableScope
  ) => {
    const builder = await createSftBuilder(metaplex, operation.input);
    scope.throwIfCanceled();
    return builder.sendAndConfirm(metaplex, operation.input.confirmOptions);
  },
};

// -----------------
// Builder
// -----------------

export type CreateSftBuilderParams = Omit<CreateSftInput, 'confirmOptions'> & {
  createMintAccountInstructionKey?: string;
  initializeMintInstructionKey?: string;
  createAssociatedTokenAccountInstructionKey?: string;
  createTokenAccountInstructionKey?: string;
  initializeTokenInstructionKey?: string;
  mintTokensInstructionKey?: string;
  createMetadataInstructionKey?: string;
  createMasterEditionInstructionKey?: string;
};

export type CreateSftBuilderContext = Omit<CreateSftOutput, 'response'>;

export const createSftBuilder = async (
  metaplex: Metaplex,
  params: CreateSftBuilderParams
): Promise<TransactionBuilder<CreateSftBuilderContext>> => {
  const {
    payer = metaplex.identity(),
    mint = { new: Keypair.generate() },
    token,
    updateAuthority = metaplex.identity(),
    mintAuthority = metaplex.identity(),
  } = params;

  const mintAddress = 'new' in mint ? mint.new.publicKey : mint.existing;
  const tokenAddress = token ? toTokenAddress(mintAddress, token) : null;
  const mintAndTokenBuilder = await createMintAndTokenForSftBuilder(
    metaplex,
    params
  );

  const metadataPda = findMetadataPda(mintAddress);
  const creators =
    params.creators ?? toUniformVerifiedCreators(updateAuthority.publicKey);

  return (
    TransactionBuilder.make<CreateSftBuilderContext>()
      .setFeePayer(payer)
      .setContext({
        mintAddress,
        metadataAddress: metadataPda,
        tokenAddress,
      })

      // Create the mint and token accounts before minting 1 token to the owner.
      .add(mintAndTokenBuilder)

      // Create metadata account.
      .add({
        instruction: createCreateMetadataAccountV2Instruction(
          {
            metadata: metadataPda,
            mint: mintAddress,
            mintAuthority: mintAuthority.publicKey,
            payer: payer.publicKey,
            updateAuthority: updateAuthority.publicKey,
          },
          {
            createMetadataAccountArgsV2: {
              data: {
                name: params.name,
                symbol: params.symbol ?? '',
                uri: params.uri,
                sellerFeeBasisPoints: params.sellerFeeBasisPoints,
                creators: toNullCreators(creators),
                collection: params.collection ?? null,
                uses: params.uses ?? null,
              },
              isMutable: params.isMutable ?? true,
            },
          }
        ),
        signers: [payer, mintAuthority],
        key: params.createMetadataInstructionKey ?? 'createMetadata',
      })
  );
};

const createMintAndTokenForSftBuilder = async (
  metaplex: Metaplex,
  params: CreateSftBuilderParams
): Promise<TransactionBuilder> => {
  const {
    payer = metaplex.identity(),
    mint = { new: Keypair.generate() },
    token,
    mintAuthority = metaplex.identity(),
    freezeAuthority = metaplex.identity().publicKey,
  } = params;

  const mintAddress = 'new' in mint ? mint.new.publicKey : mint.existing;
  const builder = TransactionBuilder.make();

  // Create the mint account if it doesn't exist.
  if ('new' in mint) {
    builder.add(
      await metaplex
        .tokens()
        .builders()
        .createMint({
          decimals: params.decimals ?? 0,
          mint: mint.new,
          payer,
          mintAuthority: mintAuthority.publicKey,
          freezeAuthority,
          tokenProgram: params.tokenProgram,
          createAccountInstructionKey: params.createMintAccountInstructionKey,
          initializeMintInstructionKey: params.initializeMintInstructionKey,
        })
    );
  }

  // Create the associated token account if it doesn't exist.
  if (token && 'owner' in token) {
    builder.add(
      await metaplex.tokens().builders().createToken({
        mint: mintAddress,
        owner: token.owner,
        payer,
        tokenProgram: params.tokenProgram,
        associatedTokenProgram: params.associatedTokenProgram,
        createAssociatedTokenAccountInstructionKey:
          params.createAssociatedTokenAccountInstructionKey,
        createAccountInstructionKey: params.createTokenAccountInstructionKey,
        initializeTokenInstructionKey: params.initializeTokenInstructionKey,
      })
    );
  }

  // Mint provided amount to the token account.
  if (token) {
    builder.add(
      metaplex
        .tokens()
        .builders()
        .mintTokens({
          mint: mintAddress,
          destination: toTokenAddress(mintAddress, token),
          amount: token.amount,
          mintAuthority,
          tokenProgram: params.tokenProgram,
          instructionKey: params.mintTokensInstructionKey,
        })
    );
  }

  return builder;
};
