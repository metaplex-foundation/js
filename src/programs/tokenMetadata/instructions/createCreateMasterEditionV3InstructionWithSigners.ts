import { PublicKey } from '@solana/web3.js';
import { bignum } from '@metaplex-foundation/beet';
import { createCreateMasterEditionV3Instruction } from '@metaplex-foundation/mpl-token-metadata';
import { Signer } from '@/types';
import { InstructionWithSigners } from '@/utils';

export interface CreateCreateMasterEditionV3InstructionWithSignersParams {
  maxSupply?: bignum;
  payer: Signer;
  mintAuthority: Signer;
  updateAuthority: Signer;
  mint: PublicKey;
  metadata: PublicKey;
  masterEdition: PublicKey;
  instructionKey?: string;
}

export const createCreateMasterEditionV3InstructionWithSigners = (
  params: CreateCreateMasterEditionV3InstructionWithSignersParams
): InstructionWithSigners => {
  const {
    maxSupply = null,
    payer,
    mintAuthority,
    updateAuthority,
    mint,
    metadata,
    masterEdition,
    instructionKey = 'createMasterEditionV3',
  } = params;

  return {
    instruction: createCreateMasterEditionV3Instruction(
      {
        edition: masterEdition,
        mint,
        updateAuthority: updateAuthority.publicKey,
        mintAuthority: mintAuthority.publicKey,
        payer: payer.publicKey,
        metadata,
      },
      { createMasterEditionArgs: { maxSupply } }
    ),
    signers: [payer, mintAuthority, updateAuthority],
    key: instructionKey,
  };
};
