import { Metaplex } from '@/Metaplex';
import {
  Operation,
  OperationHandler,
  Signer,
  toBigNumber,
  token,
  useOperation,
} from '@/types';
import { DisposableScope, Task, TransactionBuilder } from '@/utils';
import { createMintNewEditionFromMasterEditionViaTokenInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findAssociatedTokenAccountPda } from '../../tokenModule';
import { toOriginalEditionAccount } from '../accounts';
import { HasMintAddress, toMintAddress } from '../helpers';
import {
  assertNftWithToken,
  NftOriginalEdition,
  NftWithToken,
  toNftOriginalEdition,
} from '../models';
import type { NftBuildersClient } from '../NftBuildersClient';
import type { NftClient } from '../NftClient';
import {
  findEditionMarkerPda,
  findEditionPda,
  findMasterEditionV2Pda,
  findMetadataPda,
} from '../pdas';

// -----------------
// Clients
// -----------------

/** @internal */
export function _printNewEditionClient(
  this: NftClient,
  originalNft: HasMintAddress,
  input: Omit<PrintNewEditionInput, 'originalMint'> = {}
): Task<PrintNewEditionOutput & { nft: NftWithToken }> {
  return new Task(async (scope) => {
    const originalMint = toMintAddress(originalNft);
    const operation = printNewEditionOperation({ originalMint, ...input });
    const output = await this.metaplex.operations().execute(operation, scope);
    scope.throwIfCanceled();
    const nft = await this.findByMint(output.mintSigner.publicKey, {
      tokenAddress: output.tokenAddress,
    }).run(scope);
    assertNftWithToken(nft);
    return { ...output, nft };
  });
}

/** @internal */
export function _printNewEditionBuildersClient(
  this: NftBuildersClient,
  input: PrintNewEditionBuilderParams
) {
  return printNewEditionBuilder(this.metaplex, input);
}

// -----------------
// Operation
// -----------------

const Key = 'PrintNewEditionOperation' as const;
export const printNewEditionOperation =
  useOperation<PrintNewEditionOperation>(Key);
export type PrintNewEditionOperation = Operation<
  typeof Key,
  PrintNewEditionInput,
  PrintNewEditionOutput
>;

export type PrintNewEditionInput = {
  originalMint: PublicKey;
  originalTokenAccountOwner?: Signer; // Defaults to mx.identity().
  originalTokenAccount?: PublicKey; // Defaults to associated token address.
  newMint?: Signer; // Defaults to Keypair.generate().
  newMintAuthority?: Signer; // Defaults to mx.identity().
  newUpdateAuthority?: PublicKey; // Defaults to mx.identity().
  newOwner?: PublicKey; // Defaults to mx.identity().
  newTokenAccount?: Signer; // Defaults to creating an associated token account.
  newFreezeAuthority?: PublicKey; // Defaults to mx.identity().
  payer?: Signer; // Defaults to mx.identity().
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;
  confirmOptions?: ConfirmOptions;
};

export type PrintNewEditionOutput = {
  response: SendAndConfirmTransactionResponse;
  mintSigner: Signer;
  metadataAddress: PublicKey;
  editionAddress: PublicKey;
  tokenAddress: PublicKey;
  updatedOriginalEdition: NftOriginalEdition;
};

// -----------------
// Handler
// -----------------

export const printNewEditionOperationHandler: OperationHandler<PrintNewEditionOperation> =
  {
    handle: async (
      operation: PrintNewEditionOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const builder = await printNewEditionBuilder(metaplex, operation.input);
      scope.throwIfCanceled();
      return builder.sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

export type PrintNewEditionBuilderParams = Omit<
  PrintNewEditionInput,
  'confirmOptions'
> & {
  createMintAccountInstructionKey?: string;
  initializeMintInstructionKey?: string;
  createAssociatedTokenAccountInstructionKey?: string;
  createTokenAccountInstructionKey?: string;
  initializeTokenInstructionKey?: string;
  mintTokensInstructionKey?: string;
  printNewEditionInstructionKey?: string;
};

export type PrintNewEditionBuilderContext = Omit<
  PrintNewEditionOutput,
  'response'
>;

export const printNewEditionBuilder = async (
  metaplex: Metaplex,
  params: PrintNewEditionBuilderParams
): Promise<TransactionBuilder<PrintNewEditionBuilderContext>> => {
  const {
    originalMint,
    newMint = Keypair.generate(),
    newMintAuthority = metaplex.identity(),
    newUpdateAuthority = metaplex.identity().publicKey,
    newOwner = metaplex.identity().publicKey,
    newTokenAccount,
    newFreezeAuthority = metaplex.identity().publicKey,
    payer = metaplex.identity(),
    tokenProgram,
    associatedTokenProgram,
    printNewEditionInstructionKey = 'printNewEdition',
  } = params;

  // Original NFT.
  const originalMetadataAddress = findMetadataPda(originalMint);
  const originalEditionAddress = findMasterEditionV2Pda(originalMint);
  const originalEditionAccount = toOriginalEditionAccount(
    await metaplex.rpc().getAccount(originalEditionAddress)
  );
  const originalEdition = toNftOriginalEdition(originalEditionAccount);
  const edition = toBigNumber(originalEdition.supply.addn(1));
  const updatedOriginalEdition = { ...originalEdition, supply: edition };
  const originalEditionMarkPda = findEditionMarkerPda(originalMint, edition);

  // New NFT.
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
      freezeAuthority: newFreezeAuthority ?? null,
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
        updatedOriginalEdition,
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
