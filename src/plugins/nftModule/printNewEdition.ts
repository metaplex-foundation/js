import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { Metaplex } from '@/Metaplex';
import {
  createMintNewEditionFromMasterEditionViaTokenInstructionWithSigners,
  createMintNewEditionFromMasterEditionViaVaultProxyInstructionWithSigners,
  findEditionMarkerPda,
  findEditionPda,
  findMasterEditionV2Pda,
  findMetadataPda,
} from '@/programs';
import {
  useOperation,
  Operation,
  OperationHandler,
  Signer,
  token,
  toBigNumber,
  isSigner,
} from '@/types';
import {
  DisposableScope,
  InstructionWithSigners,
  TransactionBuilder,
} from '@/utils';
import { Nft } from './Nft';
import { SendAndConfirmTransactionResponse } from '..';
import { assertNftOriginalEdition } from './NftEdition';

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

export type PrintNewEditionInput = PrintNewEditionSharedInput &
  PrintNewEditionViaInput;

export type PrintNewEditionSharedInput = {
  originalNft: Nft;
  newMint?: Signer; // Defaults to Keypair.generate().
  newMintAuthority?: Signer; // Defaults to mx.identity().
  newUpdateAuthority?: PublicKey; // Defaults to mx.identity().
  newOwner?: PublicKey; // Defaults to mx.identity().
  newFreezeAuthority?: PublicKey; // Defaults to mx.identity().
  payer?: Signer; // Defaults to mx.identity().
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;
  confirmOptions?: ConfirmOptions;
};

export type PrintNewEditionViaInput =
  | {
      via?: 'token';
      originalTokenAccountOwner?: Signer; // Defaults to mx.identity().
      originalTokenAccount?: PublicKey; // Defaults to associated token address.
    }
  | {
      via: 'vault';
      vaultAuthority: Signer;
      safetyDepositStore: PublicKey;
      safetyDepositBox: PublicKey;
      vault: PublicKey;
      tokenVaultProgram?: PublicKey;
    };

export type PrintNewEditionOutput = {
  response: SendAndConfirmTransactionResponse;
  mintSigner: Signer;
  metadataAddress: PublicKey;
  editionAddress: PublicKey;
  tokenAddress: PublicKey;
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
    originalNft,
    newMint = Keypair.generate(),
    newMintAuthority = metaplex.identity(),
    newUpdateAuthority = metaplex.identity().publicKey,
    newOwner = metaplex.identity().publicKey,
    newFreezeAuthority = metaplex.identity().publicKey,
    payer = metaplex.identity(),
    tokenProgram,
    associatedTokenProgram,
    printNewEditionInstructionKey = 'printNewEdition',
  } = params;

  // Original NFT.
  const originalNftEdition = originalNft.edition;
  assertNftOriginalEdition(originalNftEdition);
  const edition = toBigNumber(originalNftEdition.supply.addn(1));
  const originalEditionMarkPda = findEditionMarkerPda(
    originalNft.mintAddress,
    edition
  );

  // New NFT.
  const newMetadataAddress = findMetadataPda(newMint.publicKey);
  const newEditionAddress = findEditionPda(newMint.publicKey);
  const sharedInput = {
    edition,
    newMint,
    newMetadata: newMetadataAddress,
    newEdition: newEditionAddress,
    newMintAuthority,
    newUpdateAuthority,
    newOwner,
    newFreezeAuthority,
    payer,
    originalMetadata: originalNft.metadataAddress,
    originalEdition: originalNft.edition.address,
    originalEditionMarkPda,
    tokenProgram,
    associatedTokenProgram,
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

  let printNewEditionInstructionWithSigners: InstructionWithSigners;
  if (params.via === 'vault') {
    printNewEditionInstructionWithSigners =
      createMintNewEditionFromMasterEditionViaVaultProxyInstructionWithSigners({
        edition,
        newMetadata,
        newEdition,
        masterEdition: originalEdition,
        newMint,
        editionMarkPda: originalEditionMarkPda,
        newMintAuthority,
        payer,
        vaultAuthority: params.vaultAuthority,
        safetyDepositStore: params.safetyDepositStore,
        safetyDepositBox: params.safetyDepositBox,
        vault: params.vault,
        newMetadataUpdateAuthority: newUpdateAuthority,
        metadata: originalMetadata,
        tokenVaultProgram: params.tokenVaultProgram,
        instructionKey: printNewEditionInstructionKey,
      });
  } else {
    printNewEditionInstructionWithSigners =
      createMintNewEditionFromMasterEditionViaTokenInstructionWithSigners({
        edition,
        newMetadata,
        newEdition,
        masterEdition: originalEdition,
        newMint,
        editionMarkPda: originalEditionMarkPda,
        newMintAuthority,
        payer,
        tokenAccountOwner: params.originalTokenAccountOwner,
        tokenAccount: params.originalTokenAccount,
        newMetadataUpdateAuthority: newUpdateAuthority,
        metadata: originalMetadata,
        instructionKey: printNewEditionInstructionKey,
      });
  }

  return (
    TransactionBuilder.make<PrintNewEditionBuilderContext>()
      .setFeePayer(payer)
      .setContext({
        mintSigner: newMint,
        metadataAddress: newMetadataAddress,
        editionAddress: newEditionAddress,
        tokenAddress,
      })

      // Create the mint and token accounts before minting 1 token to the owner.
      .add(tokenWithMintBuilder)

      // Mint new edition.
      .add(printNewEditionInstructionWithSigners)
  );
};
