import { PublicKey } from '@solana/web3.js';
import { createMintAndMintToAssociatedTokenBuilder } from '@/programs/token';
import {
  mintNewEditionFromMasterEditionViaTokenBuilder,
  mintNewEditionFromMasterEditionViaVaultProxyBuilder,
} from '@/programs/tokenMetadata';
import { TransactionBuilder, Signer } from '@/shared';
import BN from 'bn.js';

type PrintNewEditionBuilderSharedParams = {
  // Data.
  lamports: number;
  edition: number | BN;

  // New NFT.
  newMint: Signer;
  newMetadata: PublicKey;
  newEdition: PublicKey;
  newMintAuthority: Signer;
  newUpdateAuthority: PublicKey;
  newOwner: PublicKey;
  newAssociatedToken: PublicKey;
  newFreezeAuthority?: PublicKey;
  payer: Signer;

  // Master NFT.
  originalMetadata: PublicKey;
  originalEdition: PublicKey;
  originalEditionMarkPda: PublicKey;

  // Programs.
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;

  // Instruction keys.
  createAccountInstructionKey?: string;
  initializeMintInstructionKey?: string;
  createAssociatedTokenInstructionKey?: string;
  mintToInstructionKey?: string;
  mintNewEditionInstructionKey?: string;
};

export type PrintNewEditionBuilderParams = PrintNewEditionBuilderSharedParams &
  (
    | {
        via: 'token';
        originalTokenAccountOwner: Signer;
        originalTokenAccount: PublicKey;
      }
    | {
        via: 'vault';
        vaultAuthority: Signer;
        safetyDepositStore: PublicKey;
        safetyDepositBox: PublicKey;
        vault: PublicKey;
        tokenVaultProgram?: PublicKey;
      }
  );

export const printNewEditionBuilder = (
  params: PrintNewEditionBuilderParams
): TransactionBuilder => {
  const {
    // Data.
    lamports,
    edition,

    // New NFT.
    newMint,
    newMetadata,
    newEdition,
    newMintAuthority,
    newUpdateAuthority,
    newOwner,
    newAssociatedToken,
    newFreezeAuthority,
    payer,

    // Master NFT.
    originalMetadata,
    originalEdition,
    originalEditionMarkPda,

    // Programs.
    tokenProgram,
    associatedTokenProgram,

    // Instruction keys.
    createAccountInstructionKey,
    initializeMintInstructionKey,
    createAssociatedTokenInstructionKey,
    mintToInstructionKey,
    mintNewEditionInstructionKey = 'mintNewEditionFromMasterEdition',
  } = params;

  let mintNewEditionViaBuilder: TransactionBuilder;
  if (params.via === 'token') {
    mintNewEditionViaBuilder = mintNewEditionFromMasterEditionViaTokenBuilder({
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
      instructionKey: mintNewEditionInstructionKey,
    });
  } else {
    mintNewEditionViaBuilder = mintNewEditionFromMasterEditionViaVaultProxyBuilder({
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
      instructionKey: mintNewEditionInstructionKey,
    });
  }

  return (
    TransactionBuilder.make()

      // Create the mint account and send one token to the holder.
      .add(
        createMintAndMintToAssociatedTokenBuilder({
          lamports,
          decimals: 0,
          amount: 1,
          createAssociatedToken: true,
          mint: newMint,
          payer,
          mintAuthority: newMintAuthority,
          owner: newOwner,
          associatedToken: newAssociatedToken,
          freezeAuthority: newFreezeAuthority,
          tokenProgram,
          associatedTokenProgram,
          createAccountInstructionKey,
          initializeMintInstructionKey,
          createAssociatedTokenInstructionKey,
          mintToInstructionKey,
        })
      )

      // Mint new edition.
      .add(mintNewEditionViaBuilder)
  );
};
