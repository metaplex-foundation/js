import type { PublicKey } from './PublicKey';
import type { Signer } from './Signer';

export type WrappedInstruction = {
  instruction: Instruction;
  signers: Signer[];
  bytesCreatedOnChain: number;
};

export type Instruction = {
  keys: AccountMeta[];
  programId: PublicKey;
  data: Uint8Array;
};

export type AccountMeta = {
  pubkey: PublicKey;
  isSigner: boolean;
  isWritable: boolean;
};
