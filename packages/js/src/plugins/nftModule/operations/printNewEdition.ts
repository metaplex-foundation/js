import { Metaplex } from '@/Metaplex';
import {
  BigNumber,
  Operation,
  OperationHandler,
  Signer,
  toBigNumber,
  token,
  useOperation,
} from '@/types';
import { DisposableScope, TransactionBuilder } from '@/utils';
import { createMintNewEditionFromMasterEditionViaTokenInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findAssociatedTokenAccountPda } from '../../tokenModule';
import { toOriginalEditionAccount } from '../accounts';
import {
  assertNftWithToken,
  NftWithToken,
  toNftOriginalEdition,
} from '../models';
import {
  findEditionMarkerPda,
  findEditionPda,
  findMasterEditionV2Pda,
  findMetadataPda,
} from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'PrintNewEditionOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const printNewEditionOperation =
  useOperation<PrintNewEditionOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type PrintNewEditionOperation = Operation<
  typeof Key,
  PrintNewEditionInput,
  PrintNewEditionOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type PrintNewEditionInput = {
  originalMint: PublicKey;
  originalTokenAccountOwner?: Signer; // Defaults to mx.identity().
  originalTokenAccount?: PublicKey; // Defaults to associated token address.
  newMint?: Signer; // Defaults to Keypair.generate().
  newUpdateAuthority?: PublicKey; // Defaults to mx.identity().
  newOwner?: PublicKey; // Defaults to mx.identity().
  newTokenAccount?: Signer; // Defaults to creating an associated token account.
  payer?: Signer; // Defaults to mx.identity().
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type PrintNewEditionOutput = {
  response: SendAndConfirmTransactionResponse;
  nft: NftWithToken;
  mintSigner: Signer;
  metadataAddress: PublicKey;
  editionAddress: PublicKey;
  tokenAddress: PublicKey;
  updatedSupply: BigNumber;
};

/**
 * @group Operations
 * @category Handlers
 */
export const printNewEditionOperationHandler: OperationHandler<PrintNewEditionOperation> =
  {
    handle: async (
      operation: PrintNewEditionOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const originalEditionAccount = await metaplex
        .rpc()
        .getAccount(findMasterEditionV2Pda(operation.input.originalMint));
      scope.throwIfCanceled();

      const originalEdition = toNftOriginalEdition(
        toOriginalEditionAccount(originalEditionAccount)
      );
      const builder = await printNewEditionBuilder(metaplex, {
        ...operation.input,
        originalSupply: originalEdition.supply,
      });
      scope.throwIfCanceled();

      const output = await builder.sendAndConfirm(
        metaplex,
        operation.input.confirmOptions
      );
      scope.throwIfCanceled();

      const nft = await metaplex
        .nfts()
        .findByMint({
          mintAddress: output.mintSigner.publicKey,
          tokenAddress: output.tokenAddress,
        })
        .run(scope);
      scope.throwIfCanceled();

      assertNftWithToken(nft);
      return { ...output, nft };
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type PrintNewEditionBuilderParams = Omit<
  PrintNewEditionInput,
  'confirmOptions'
> & {
  originalSupply: BigNumber;
  createMintAccountInstructionKey?: string;
  initializeMintInstructionKey?: string;
  createAssociatedTokenAccountInstructionKey?: string;
  createTokenAccountInstructionKey?: string;
  initializeTokenInstructionKey?: string;
  mintTokensInstructionKey?: string;
  printNewEditionInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type PrintNewEditionBuilderContext = Omit<
  PrintNewEditionOutput,
  'response' | 'nft'
>;

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const printNewEditionBuilder = async (
  metaplex: Metaplex,
  params: PrintNewEditionBuilderParams
): Promise<TransactionBuilder<PrintNewEditionBuilderContext>> => {
  const {
    originalMint,
    newMint = Keypair.generate(),
    newUpdateAuthority = metaplex.identity().publicKey,
    newOwner = metaplex.identity().publicKey,
    newTokenAccount,
    payer = metaplex.identity(),
    tokenProgram,
    associatedTokenProgram,
    printNewEditionInstructionKey = 'printNewEdition',
  } = params;

  // Original NFT.
  const originalMetadataAddress = findMetadataPda(originalMint);
  const originalEditionAddress = findMasterEditionV2Pda(originalMint);
  const edition = toBigNumber(params.originalSupply.addn(1));
  const originalEditionMarkPda = findEditionMarkerPda(originalMint, edition);

  // New NFT.
  const newMintAuthority = Keypair.generate(); // Will be overwritten by edition PDA.
  const newMetadataAddress = findMetadataPda(newMint.publicKey);
  const newEditionAddress = findEditionPda(newMint.publicKey);
  const sharedAccounts = {
    newMetadata: newMetadataAddress,
    newEdition: newEditionAddress,
    masterEdition: originalEditionAddress,
    newMint: newMint.publicKey,
    editionMarkPda: originalEditionMarkPda,
    newMintAuthority: newMintAuthority.publicKey,
    payer: payer.publicKey,
    newMetadataUpdateAuthority: newUpdateAuthority,
    metadata: originalMetadataAddress,
  };

  const tokenWithMintBuilder = await metaplex
    .tokens()
    .builders()
    .createTokenWithMint({
      decimals: 0,
      initialSupply: token(1),
      mint: newMint,
      mintAuthority: newMintAuthority,
      freezeAuthority: newMintAuthority.publicKey,
      owner: newOwner,
      token: newTokenAccount,
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
  const originalTokenAccountOwner =
    params.originalTokenAccountOwner ?? metaplex.identity();
  const originalTokenAccount =
    params.originalTokenAccount ??
    findAssociatedTokenAccountPda(
      originalMint,
      originalTokenAccountOwner.publicKey
    );

  return (
    TransactionBuilder.make<PrintNewEditionBuilderContext>()
      .setFeePayer(payer)
      .setContext({
        mintSigner: newMint,
        metadataAddress: newMetadataAddress,
        editionAddress: newEditionAddress,
        tokenAddress,
        updatedSupply: edition,
      })

      // Create the mint and token accounts before minting 1 token to the owner.
      .add(tokenWithMintBuilder)

      // Mint new edition.
      .add({
        instruction: createMintNewEditionFromMasterEditionViaTokenInstruction(
          {
            ...sharedAccounts,
            tokenAccountOwner: originalTokenAccountOwner.publicKey,
            tokenAccount: originalTokenAccount,
          },
          { mintNewEditionFromMasterEditionViaTokenArgs: { edition } }
        ),
        signers: [newMint, newMintAuthority, payer, originalTokenAccountOwner],
        key: printNewEditionInstructionKey,
      })
  );
};
