import type { Keypair } from './KeyPair';
import type { Pda, PublicKey } from './PublicKey';

export interface EddsaInterface {
  generateKeypair: () => Keypair;
  createKeypairFromSecretKey: (secretKey: Uint8Array) => Keypair;
  createKeypairFromSeed: (seed: Uint8Array) => Keypair;
  createPublicKey: (input: PublicKeyInput) => PublicKey;
  createDefaultPublicKey: () => PublicKey;
  findPda: (programId: PublicKey, seeds: Uint8Array[]) => Pda;
  sign: (message: Uint8Array, keypair: Keypair) => Uint8Array;
  verify: (
    message: Uint8Array,
    signature: Uint8Array,
    publicKey: PublicKey
  ) => boolean;
}

export type PublicKeyInput = number | string | Uint8Array | number[] | object;

export class NullEddsa implements EddsaInterface {
  // TODO(loris): Custom errors.
  generateKeypair(): Keypair {
    throw new Error('Method not implemented.');
  }
  createKeypairFromSecretKey(): Keypair {
    throw new Error('Method not implemented.');
  }
  createKeypairFromSeed(): Keypair {
    throw new Error('Method not implemented.');
  }
  createPublicKey(): PublicKey {
    throw new Error('Method not implemented.');
  }
  createDefaultPublicKey(): PublicKey {
    throw new Error('Method not implemented.');
  }
  findPda(): Pda {
    throw new Error('Method not implemented.');
  }
  sign(): Uint8Array {
    throw new Error('Method not implemented.');
  }
  verify(): boolean {
    throw new Error('Method not implemented.');
  }
}
