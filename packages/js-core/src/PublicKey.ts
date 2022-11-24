export type PublicKey = {
  equals(that: PublicKey): boolean;
  toBytes(): Uint8Array;
  toString(): string;
};
