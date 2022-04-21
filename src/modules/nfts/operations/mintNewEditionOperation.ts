import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { useOperation, Signer, Operation } from '@/shared';

export const mintNewEditionOperation =
  useOperation<MintNewEditionOperation>('MintNewEditionOperation');

export type MintNewEditionOperation = Operation<
  'MintNewEditionOperation',
  MintNewEditionInput,
  MintNewEditionOutput
>;

type MintNewEditionSharedInput = {
  masterMint: PublicKey;
  newMint?: Signer;
  newMintAuthority?: Signer;
  newUpdateAuthority?: PublicKey;
  newOwner?: PublicKey;
  newFreezeAuthority?: PublicKey;
  payer?: Signer;
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;
  confirmOptions?: ConfirmOptions;
};

export type MintNewEditionInput = MintNewEditionSharedInput &
  (
    | {
        via: 'token';
        masterTokenAccountOwner?: Signer;
        masterTokenAccount?: PublicKey;
      }
    | {
        via: 'vault';
        vaultAuthority: Signer;
        safetyDepositStore: PublicKey;
        safetyDepositBox: PublicKey;
        vault: PublicKey;
        tokenVaultProgram?: PublicKey;
      }
  );

export type MintNewEditionOutput = {
  mint: Signer;
  metadata: PublicKey;
  edition: PublicKey;
  associatedToken: PublicKey;
  transactionId: string;
};
