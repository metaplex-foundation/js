import { Keypair } from './Keypair';
import { PublicKey } from './PublicKey';

export interface Transaction {
  // constructor(message: TransactionMessage, signatures?: Array<Uint8Array>);
  signatures: Uint8Array[];
  message: TransactionMessage;
  version: TransactionVersion;
  sign(signers: Keypair[]): void;
  addSignature(publicKey: PublicKey, signature: Uint8Array): void;
  serialize(): Uint8Array;
}

export type TransactionVersion = 'legacy' | 0;
export type TransactionMessage =
  | LegacyTransactionMessage
  | TransactionMessageV0;

export type SerializedTransaction = Uint8Array;
export type TransactionSignature = string;
export type Blockhash = string;

export interface LegacyTransactionMessage {
  // constructor(args: MessageArgs);
  version: 'legacy';
  staticAccountKeys: PublicKey[];
  recentBlockhash: Blockhash;
  compiledInstructions: CompiledInstruction[];
  addressTableLookups: AddressTableLookup[];
  isAccountSigner(index: number): boolean;
  isAccountWritable(index: number): boolean;
  serialize(): Uint8Array;
}

export interface TransactionMessageV0 {
  // constructor(args: MessageV0Args);
  version: 0;
  staticAccountKeys: PublicKey[];
  recentBlockhash: Blockhash;
  compiledInstructions: CompiledInstruction[];
  addressTableLookups: AddressTableLookup[];
  isAccountSigner(index: number): boolean;
  isAccountWritable(index: number): boolean;
  serialize(): Uint8Array;
}

export type CompiledInstruction = {
  /** Index into the transaction keys array indicating the program account that executes this instruction */
  programIdIndex: number;
  /** Ordered indices into the transaction keys array indicating which accounts to pass to the program */
  accountKeyIndexes: number[];
  /** The program input data */
  data: Uint8Array;
};

export type AddressTableLookup = {
  accountKey: PublicKey;
  writableIndexes: number[];
  readonlyIndexes: number[];
};
