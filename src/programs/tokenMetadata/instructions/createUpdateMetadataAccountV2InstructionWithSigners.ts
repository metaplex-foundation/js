import { PublicKey } from '@solana/web3.js';
import {
  createUpdateMetadataAccountV2Instruction,
  DataV2,
} from '@metaplex-foundation/mpl-token-metadata';
import { Signer } from '@/types';
import { InstructionWithSigners } from '@/utils';

export interface CreateUpdateMetadataAccountV2InstructionWithSignersParams {
  data: DataV2;
  newUpdateAuthority: PublicKey;
  primarySaleHappened: boolean;
  isMutable: boolean;
  metadata: PublicKey;
  updateAuthority: Signer;
  instructionKey?: string;
}

export const createUpdateMetadataAccountV2InstructionWithSigners = (
  params: CreateUpdateMetadataAccountV2InstructionWithSignersParams
): InstructionWithSigners => {
  const {
    data,
    newUpdateAuthority,
    primarySaleHappened,
    isMutable,
    metadata,
    updateAuthority,
    instructionKey = 'updateMetadatav2',
  } = params;

  return {
    instruction: createUpdateMetadataAccountV2Instruction(
      {
        metadata,
        updateAuthority: updateAuthority.publicKey,
      },
      {
        updateMetadataAccountArgsV2: {
          data,
          updateAuthority: newUpdateAuthority,
          primarySaleHappened,
          isMutable,
        },
      }
    ),
    signers: [updateAuthority],
    key: instructionKey,
  };
};
