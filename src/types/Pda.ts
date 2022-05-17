import { PublicKey, PublicKeyInitData } from '@solana/web3.js';
import { Buffer } from 'buffer';

export class Pda extends PublicKey {
  /** The bump used to generate the PDA. */
  public readonly bump: number;

  constructor(value: PublicKeyInitData, bump: number) {
    super(value);
    this.bump = bump;
  }

  static async find(
    programId: PublicKey,
    seeds: Array<Buffer | Uint8Array>
  ): Promise<Pda> {
    return this.fromPromise(PublicKey.findProgramAddress(seeds, programId));
  }

  static async fromPromise(
    promise: Promise<[PublicKey, number]>
  ): Promise<Pda> {
    const [publicKey, bump] = await promise;

    return new Pda(publicKey, bump);
  }
}
