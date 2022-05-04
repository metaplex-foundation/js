import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { useOperation, Operation } from '@/types';
import { Signer } from '@/types';

export const printNewEditionOperation = useOperation<PrintNewEditionOperation>(
  'PrintNewEditionOperation'
);

export type PrintNewEditionOperation = Operation<
  'PrintNewEditionOperation',
  PrintNewEditionInput,
  PrintNewEditionOutput
>;

export type PrintNewEditionInput = PrintNewEditionSharedInput & PrintNewEditionViaInput;

export type PrintNewEditionSharedInput = {
  originalMint: PublicKey;
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

export type PrintNewEditionViaInput =
  | {
      via?: 'token';
      originalTokenAccountOwner?: Signer;
      originalTokenAccount?: PublicKey;
    }
  | {
      via: 'vault';
      vaultAuthority: Signer;
      safetyDepositStore: PublicKey;
      safetyDepositBox: PublicKey;
      vault: PublicKey;
      tokenVaultProgram?: PublicKey;
    };

export type PrintNewEditionOutput = {
  mint: Signer;
  metadata: PublicKey;
  edition: PublicKey;
  associatedToken: PublicKey;
  transactionId: string;
};
