import { createUpdateAuthorityInstruction } from '@metaplex-foundation/mpl-candy-machine';
import { Signer } from '@/types';
import { TransactionBuilder } from '@/utils';
import { PublicKey } from '@solana/web3.js';

export type UpdateAuthorityBuilderParams = {
  // Accounts
  candyMachine: PublicKey;
  authority: Signer;
  wallet: PublicKey;

  // Instruction Args
  newAuthority: PublicKey;

  instructionKey?: string;
};

export function updateAuthorityBuilder(
  params: UpdateAuthorityBuilderParams
): TransactionBuilder {
  const {
    candyMachine,
    authority,
    wallet,
    newAuthority,
    instructionKey = 'updateCandyMachineAuthority',
  } = params;

  return TransactionBuilder.make().add({
    instruction: createUpdateAuthorityInstruction(
      {
        candyMachine,
        authority: authority.publicKey,
        wallet,
      },
      { newAuthority }
    ),
    signers: [authority],
    key: instructionKey,
  });
}
