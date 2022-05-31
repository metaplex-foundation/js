import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import {
  BaseAccount,
  Pda,
  UnparsedAccount,
  UnparsedMaybeAccount,
} from '@/types';
import { TokenMetadataProgram } from '../TokenMetadataProgram';

export class MetadataAccount extends BaseAccount<Metadata> {
  static pda(mint: PublicKey): Pda {
    return Pda.find(TokenMetadataProgram.publicKey, [
      Buffer.from('metadata', 'utf8'),
      TokenMetadataProgram.publicKey.toBuffer(),
      mint.toBuffer(),
    ]);
  }

  static from(unparsedAccount: UnparsedAccount) {
    return new MetadataAccount(this.parse(unparsedAccount, Metadata));
  }

  static fromMaybe(maybe: UnparsedMaybeAccount) {
    return maybe.exists ? this.from(maybe) : maybe;
  }
}
