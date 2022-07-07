import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import {
  Collection,
  Uses,
  createCreateMetadataAccountV2Instruction,
  createCreateMasterEditionV3Instruction,
} from '@metaplex-foundation/mpl-token-metadata';
import { Metaplex } from '@/Metaplex';
import {
  useOperation,
  Operation,
  Signer,
  OperationHandler,
  token,
  Creator,
  BigNumber,
  toUniformVerifiedCreators,
} from '@/types';
import { findMasterEditionV2Pda, findMetadataPda } from './pdas';
import { DisposableScope, Option, TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../rpcModule';

// -----------------
// Operation
// -----------------

const Key = 'CreateNftOperation' as const;
export const createNftOperation = useOperation<CreateNftOperation>(Key);
export type CreateNftOperation = Operation<
  typeof Key,
  CreateNftInput,
  CreateNftOutput
>;

export interface CreateNftInput {
  // Accounts.
  mint?: Signer; // Defaults to new generated Keypair.
  payer?: Signer; // Defaults to mx.identity().
  updateAuthority?: Signer; // Defaults to mx.identity().
  owner?: PublicKey; // Defaults to mx.identity().
  tokenAccount?: Signer; // Defaults to creating an associated token account.
  mintAuthority?: Signer; // Defaults to mx.identity().
  freezeAuthority?: Option<PublicKey>; // Defaults to mx.identity().

  // Data.
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

export interface CreateNftOutput {
  response: SendAndConfirmTransactionResponse;
  mintSigner: Signer;
  metadataAddress: PublicKey;
  masterEditionAddress: PublicKey;
  tokenAddress: PublicKey;
}

// -----------------
// Handler
// -----------------

export const createNftOperationHandler: OperationHandler<CreateNftOperation> = {
  handle: async (
    operation: CreateNftOperation,
    metaplex: Metaplex,
    scope: DisposableScope
  ) => {
    const builder = await createNftBuilder(metaplex, operation.input);
    scope.throwIfCanceled();
    return builder.sendAndConfirm(metaplex, operation.input.confirmOptions);
  },
};

// -----------------
// Builder
// -----------------

export type CreateNftBuilderParams = Omit<CreateNftInput, 'confirmOptions'> & {
  createMintAccountInstructionKey?: string;
  initializeMintInstructionKey?: string;
  createAssociatedTokenAccountInstructionKey?: string;
  createTokenAccountInstructionKey?: string;
  initializeTokenInstructionKey?: string;
  mintTokensInstructionKey?: string;
  createMetadataInstructionKey?: string;
  createMasterEditionInstructionKey?: string;
};

export type CreateNftBuilderContext = Omit<CreateNftOutput, 'response'>;

export const createNftBuilder = async (
  metaplex: Metaplex,
  params: CreateNftBuilderParams
): Promise<TransactionBuilder<CreateNftBuilderContext>> => {
  const {
    mint = Keypair.generate(),
    payer = metaplex.identity(),
    updateAuthority = metaplex.identity(),
    owner = metaplex.identity().publicKey,
    tokenAccount,
    mintAuthority = metaplex.identity(),
    freezeAuthority = metaplex.identity().publicKey,
    tokenProgram,
    associatedTokenProgram,
  } = params;

  const tokenWithMintBuilder = await metaplex
    .tokens()
    .builders()
    .createTokenWithMint({
      decimals: 0,
      initialSupply: token(1),
      mint,
      mintAuthority,
      freezeAuthority: freezeAuthority ?? null,
      owner,
      token: tokenAccount,
      payer,
      tokenProgram,
      associatedTokenProgram,
      createMintAccountInstructionKey: params.createMintAccountInstructionKey,
      initializeMintInstructionKey: params.initializeMintInstructionKey,
      createAssociatedTokenAccountInstructionKey:
        params.createAssociatedTokenAccountInstructionKey,
      createTokenAccountInstructionKey: params.createTokenAccountInstructionKey,
      initializeTokenInstructionKey: params.initializeTokenInstructionKey,
      mintTokensInstructionKey: params.mintTokensInstructionKey,
    });

  const { tokenAddress } = tokenWithMintBuilder.getContext();
  const metadataPda = findMetadataPda(mint.publicKey);
  const masterEditionPda = findMasterEditionV2Pda(mint.publicKey);
  const creators =
    params.creators ?? toUniformVerifiedCreators(updateAuthority.publicKey);

  return (
    TransactionBuilder.make<CreateNftBuilderContext>()
      .setFeePayer(payer)
      .setContext({
        mintSigner: mint,
        metadataAddress: metadataPda,
        masterEditionAddress: masterEditionPda,
        tokenAddress,
      })

      // Create the mint and token accounts before minting 1 token to the owner.
      .add(tokenWithMintBuilder)

      // Create metadata account.
      .add({
        instruction: createCreateMetadataAccountV2Instruction(
          {
            metadata: metadataPda,
            mint: mint.publicKey,
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
                creators,
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

      // Create master edition account (prevents further minting).
      .add({
        instruction: createCreateMasterEditionV3Instruction(
          {
            edition: masterEditionPda,
            mint: mint.publicKey,
            updateAuthority: updateAuthority.publicKey,
            mintAuthority: mintAuthority.publicKey,
            payer: payer.publicKey,
            metadata: metadataPda,
          },
          {
            createMasterEditionArgs: {
              maxSupply: params.maxSupply === undefined ? 0 : params.maxSupply,
            },
          }
        ),
        signers: [payer, mintAuthority, updateAuthority],
        key: params.createMasterEditionInstructionKey ?? 'createMasterEdition',
      })
  );
};
