import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { Edition, Key } from '@metaplex-foundation/mpl-token-metadata';
import {
  BaseAccount,
  Pda,
  UnparsedAccount,
  UnparsedMaybeAccount,
} from '@/types';
import { OriginalEditionAccount } from './OriginalEditionAccount';

export class PrintEditionAccount extends BaseAccount<Edition> {
  static async pda(mint: PublicKey): Promise<Pda> {
    return OriginalEditionAccount.pda(mint);
  }

  static recognizes(buffer: Buffer): boolean {
    return buffer?.[0] === Key.EditionV1;
  }

  static from(unparsedAccount: UnparsedAccount) {
    return new PrintEditionAccount(this.parse(unparsedAccount, Edition));
  }

  static fromMaybe(maybe: UnparsedMaybeAccount) {
    return maybe.exists ? this.from(maybe) : maybe;
  }
}
