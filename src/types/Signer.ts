import { PublicKey, Transaction } from '@solana/web3.js';

export type Signer = KeypairSigner | IdentitySigner;

export type KeypairSigner = {
  publicKey: PublicKey;
  secretKey: Uint8Array;
};

export type IdentitySigner = {
  publicKey: PublicKey;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
};

export const isKeypairSigner = (signer: Signer): signer is KeypairSigner => {
  return 'secretKey' in signer && signer.secretKey != null;
};

export const isIdentitySigner = (signer: Signer): signer is IdentitySigner => {
  return !isKeypairSigner(signer);
};

export interface SignerHistogram {
  all: Signer[];
  keypairs: KeypairSigner[];
  identities: IdentitySigner[];
}

export const getSignerHistogram = (signers: Signer[]) =>
  signers.reduce(
    (signers: SignerHistogram, signer: Signer) => {
      const duplicateIndex = signers.all.findIndex(({ publicKey }) =>
        publicKey.equals(signer.publicKey)
      );
      const duplicate = signers.all[duplicateIndex] ?? null;
      const duplicateIsIdentity = duplicate
        ? isIdentitySigner(duplicate)
        : false;
      const signerIsIdentity = isIdentitySigner(signer);

      if (!duplicate) {
        signers.all.push(signer);
        signerIsIdentity
          ? signers.identities.push(signer)
          : signers.keypairs.push(signer);
      } else if (duplicateIsIdentity && !signerIsIdentity) {
        // Prefer keypair than identity signer as it requires less user interactions.
        const duplicateIdentitiesIndex = signers.identities.findIndex(
          ({ publicKey }) => publicKey.equals(signer.publicKey)
        );
        signers.all.splice(duplicateIndex, 1);
        signers.identities.splice(duplicateIdentitiesIndex, 1);
        signers.all.push(signer);
        signers.keypairs.push(signer);
      }

      return signers;
    },
    { all: [], keypairs: [], identities: [] }
  );
