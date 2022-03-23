import { TransactionBuilder } from '@/programs';
import { updateMetadataV2Builder } from '@/programs/tokenMetadata';
import { DataV2 } from '@/programs/tokenMetadata/generated';
import { Signer } from '@/utils';
import { PublicKey } from '@solana/web3.js';

export interface UpdateNftBuilderParams {
  // Data.
  data: DataV2;
  newUpdateAuthority: PublicKey;
  primarySaleHappened: boolean;
  isMutable: boolean;

  // Signers.
  updateAuthority: Signer;

  // Public keys.
  metadata: PublicKey;

  // Instruction keys.
  instructionKey?: string;
}

export const updateNftBuilder = (params: UpdateNftBuilderParams): TransactionBuilder => {
  const {
    data,
    isMutable,
    updateAuthority,
    newUpdateAuthority,
    primarySaleHappened,
    metadata,
    instructionKey,
  } = params;

  return TransactionBuilder.make().add(
    updateMetadataV2Builder({
      data,
      newUpdateAuthority,
      primarySaleHappened,
      isMutable,
      metadata,
      updateAuthority,
      instructionKey,
    })
  );
};
