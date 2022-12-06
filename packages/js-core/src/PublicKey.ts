export interface PublicKey {
  equals(that: PublicKey): boolean;
  toBytes(): Uint8Array;
  toString(): string;
}

export interface Pda extends PublicKey {
  readonly bump: number;
}
