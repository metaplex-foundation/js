import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { createMintNewEditionFromMasterEditionViaTokenInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { Signer } from '@/types';
import { TransactionBuilder } from '@/utils';

export interface MintNewEditionFromMasterEditionViaTokenBuilderParams {
  edition: number | BN;
  newMetadata: PublicKey;
  newEdition: PublicKey;
  masterEdition: PublicKey;
  newMint: Signer;
  editionMarkPda: PublicKey;
  newMintAuthority: Signer;
  payer: Signer;
  tokenAccountOwner: Signer;
  tokenAccount: PublicKey;
  newMetadataUpdateAuthority: PublicKey;
  metadata: PublicKey;
  instructionKey?: string;
}

export const mintNewEditionFromMasterEditionViaTokenBuilder = (
  params: MintNewEditionFromMasterEditionViaTokenBuilderParams
): TransactionBuilder => {
  const {
    edition,
    newMetadata,
    newEdition,
    masterEdition,
    newMint,
    editionMarkPda,
    newMintAuthority,
    payer,
    tokenAccountOwner,
    tokenAccount,
    newMetadataUpdateAuthority,
    metadata,
    instructionKey = 'mintNewEditionFromMasterEditionViaToken',
  } = params;

  return TransactionBuilder.make().add({
    instruction: createMintNewEditionFromMasterEditionViaTokenInstruction(
      {
        newMetadata,
        newEdition,
        masterEdition,
        newMint: newMint.publicKey,
        editionMarkPda,
        newMintAuthority: newMintAuthority.publicKey,
        payer: payer.publicKey,
        tokenAccountOwner: tokenAccountOwner.publicKey,
        tokenAccount,
        newMetadataUpdateAuthority,
        metadata,
      },
      { mintNewEditionFromMasterEditionViaTokenArgs: { edition } }
    ),
    signers: [newMint, newMintAuthority, payer, tokenAccountOwner],
    key: instructionKey,
  });
};
