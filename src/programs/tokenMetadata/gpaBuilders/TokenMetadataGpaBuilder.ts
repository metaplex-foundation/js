import BN from 'bn.js';
import { Key, PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { GpaBuilder } from '@/utils';
import { PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';

export class TokenMetadataGpaBuilder extends GpaBuilder {
  constructor(metaplex: Metaplex, programId?: PublicKey) {
    super(metaplex, programId ?? PROGRAM_ID);
  }

  whereKey(key: Key) {
    return this.where(0, new BN(key, 'le'));
  }
}
