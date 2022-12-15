import { Context } from './Context';
import { AccountMeta, WrappedInstruction } from './Instruction';
import { PublicKey } from './PublicKey';
import { isSigner, Signer } from './Signer';

export const updateMetadataInstructionDiscriminator = 12;

// Accounts.
export type UpdateMetadataInstructionAccounts = {
  metadata: PublicKey;
  authority: Signer;
  collectionAuthority: PublicKey | Signer;
};

// Arguments.
export type UpdateMetadataInstructionArgs = {
  uses: number; // 4 bytes
  maxEditions: bigint; // 8 bytes
};

export const getUpdateMetadataInstructionDataSerializer = (
  context: Pick<Context, 'serializer'>
) => {
  return context.serializer.struct<
    UpdateMetadataInstructionArgs & { discriminator?: number },
    UpdateMetadataInstructionArgs & { discriminator: number }
  >('updateMetadataInstructionData', [
    ['discriminator', context.serializer.u8],
    ['uses', context.serializer.u32],
    ['maxEditions', context.serializer.u64],
  ]);
};

export const createUpdateMetadataInstruction = (
  context: Pick<Context, 'serializer'>,
  accounts: UpdateMetadataInstructionAccounts,
  args: UpdateMetadataInstructionArgs
): WrappedInstruction => {
  const signers: Signer[] = [];
  const keys: AccountMeta[] = [];

  // Metadata account.
  keys.push({ pubkey: accounts.metadata, isSigner: false, isWritable: true });

  // Authority account.
  signers.push(accounts.authority);
  keys.push({
    pubkey: accounts.authority.publicKey,
    isSigner: true,
    isWritable: false,
  });

  // Collection authority account.
  if (isSigner(accounts.collectionAuthority)) {
    signers.push(accounts.authority);
    keys.push({
      pubkey: accounts.collectionAuthority.publicKey,
      isSigner: true,
      isWritable: false,
    });
  } else {
    keys.push({
      pubkey: accounts.collectionAuthority,
      isSigner: false,
      isWritable: false,
    });
  }

  return {
    instruction: {
      keys,
      // programId: PublicKey;
      data: getUpdateMetadataInstructionDataSerializer(context).serialize({
        discriminator: updateMetadataInstructionDiscriminator,
        ...args,
      }),
    },
    signers,
    bytesCreatedOnChain: 0, // From ix data if any.
  };
};
