import { updateMetadataV2Builder } from '@/programs/tokenMetadata/index';
import { DataV2 } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey } from '@solana/web3.js';
import { TransactionBuilder, Signer } from '@/shared/index';

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
