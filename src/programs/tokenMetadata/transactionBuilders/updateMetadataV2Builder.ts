import { TransactionBuilder } from '@/programs/shared';
import {
  createUpdateMetadataAccountV2Instruction,
  DataV2,
} from '@/programs/tokenMetadata/generated';
import { Signer } from '@/utils';
import { PublicKey } from '@solana/web3.js';

export interface UpdateMetadataV2BuilderParams {
  data: DataV2;
  newUpdateAuthority: PublicKey;
  primarySaleHappened: boolean;
  isMutable: boolean;
  metadata: PublicKey;
  updateAuthority: Signer;
  instructionKey?: string;
}

export const updateMetadataV2Builder = (
  params: UpdateMetadataV2BuilderParams
): TransactionBuilder => {
  const {
    data,
    newUpdateAuthority,
    primarySaleHappened,
    isMutable,
    metadata,
    updateAuthority,
    instructionKey = 'updateMetadatav2',
  } = params;

  return TransactionBuilder.make().add({
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
  });
};
