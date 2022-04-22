import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { useOperation, Signer, Operation } from '@/shared';

export const printNewEditionOperation = useOperation<PrintNewEditionOperation>(
  'PrintNewEditionOperation'
);

export type PrintNewEditionOperation = Operation<
  'PrintNewEditionOperation',
  PrintNewEditionInput,
  PrintNewEditionOutput
>;

type PrintNewEditionSharedInput = {
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

export type PrintNewEditionInput = PrintNewEditionSharedInput &
  (
    | {
        via: 'token';
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
      }
  );

export type PrintNewEditionOutput = {
  mint: Signer;
  metadata: PublicKey;
  edition: PublicKey;
  associatedToken: PublicKey;
  transactionId: string;
};
