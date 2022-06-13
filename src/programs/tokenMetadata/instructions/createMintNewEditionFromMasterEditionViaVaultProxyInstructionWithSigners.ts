import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { createMintNewEditionFromMasterEditionViaVaultProxyInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { Signer } from '@/types';
import { InstructionWithSigners } from '@/utils';

export interface CreateMintNewEditionFromMasterEditionViaVaultProxyInstructionWithSignersParams {
  edition: number | BN;
  newMetadata: PublicKey;
  newEdition: PublicKey;
  masterEdition: PublicKey;
  newMint: Signer;
  editionMarkPda: PublicKey;
  newMintAuthority: Signer;
  payer: Signer;
  vaultAuthority: Signer;
  safetyDepositStore: PublicKey;
  safetyDepositBox: PublicKey;
  vault: PublicKey;
  newMetadataUpdateAuthority: PublicKey;
  metadata: PublicKey;
  tokenVaultProgram?: PublicKey;
  instructionKey?: string;
}

export const createMintNewEditionFromMasterEditionViaVaultProxyInstructionWithSigners =
  (
    params: CreateMintNewEditionFromMasterEditionViaVaultProxyInstructionWithSignersParams
  ): InstructionWithSigners => {
    const {
      edition,
      newMetadata,
      newEdition,
      masterEdition,
      newMint,
      editionMarkPda,
      newMintAuthority,
      payer,
      vaultAuthority,
      safetyDepositStore,
      safetyDepositBox,
      vault,
      newMetadataUpdateAuthority,
      metadata,
      tokenVaultProgram = new PublicKey(
        'vau1zxA2LbssAUEF7Gpw91zMM1LvXrvpzJtmZ58rPsn'
      ),
      instructionKey = 'mintNewEditionFromMasterEditionViaVaultProxy',
    } = params;

    return {
      instruction:
        createMintNewEditionFromMasterEditionViaVaultProxyInstruction(
          {
            newMetadata,
            newEdition,
            masterEdition,
            newMint: newMint.publicKey,
            editionMarkPda,
            newMintAuthority: newMintAuthority.publicKey,
            payer: payer.publicKey,
            vaultAuthority: vaultAuthority.publicKey,
            safetyDepositStore,
            safetyDepositBox,
            vault,
            newMetadataUpdateAuthority,
            metadata,
            tokenVaultProgram,
          },
          { mintNewEditionFromMasterEditionViaTokenArgs: { edition } }
        ),
      signers: [newMint, newMintAuthority, payer, vaultAuthority],
      key: instructionKey,
    };
  };
