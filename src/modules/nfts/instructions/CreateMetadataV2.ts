import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';
import { DataV2, MetadataProgram } from '@metaplex-foundation/mpl-token-metadata';

export interface CreateMetadataV2Params {
  data: DataV2,
  metadata: PublicKey,
  mint: PublicKey,
  mintAuthority: PublicKey,
  updateAuthority: PublicKey,
  feePayer: PublicKey,
  systemProgramId?: PublicKey,
  rent?: PublicKey,
  programId?: PublicKey,
}

export class CreateMetadataV2 extends TransactionInstruction {
  constructor (params: CreateMetadataV2Params) {
    const {
      data,
      metadata,
      mint,
      mintAuthority,
      updateAuthority,
      feePayer,
      systemProgramId,
      rent,
      programId,
    } = params;

    super({
      keys: [
        {
          pubkey: metadata,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: mint,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: mintAuthority,
          isSigner: true,
          isWritable: false,
        },
        {
          pubkey: feePayer,
          isSigner: true,
          isWritable: false,
        },
        {
          pubkey: updateAuthority,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: systemProgramId ?? SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: rent ?? SYSVAR_RENT_PUBKEY,
          isSigner: false,
          isWritable: false,
        },
      ],
      data: undefined,
      programId: programId ?? MetadataProgram.PUBKEY,
    })
  }
}
