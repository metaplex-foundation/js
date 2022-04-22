import { AccountInfo, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { Edition, Key } from '@metaplex-foundation/mpl-token-metadata';
import { OriginalEditionAccount } from './OriginalEditionAccount';
import { Account, Pda } from '@/shared';

export class PrintEditionAccount extends Account<Edition> {
  static async pda(mint: PublicKey): Promise<Pda> {
    return OriginalEditionAccount.pda(mint);
  }

  static recognizes(buffer: Buffer): boolean {
    return buffer?.[0] === Key.EditionV1;
  }

  static fromAccountInfo(
    publicKey: PublicKey,
    accountInfo: AccountInfo<Buffer>
  ): PrintEditionAccount {
    return this.parseAccountInfo(publicKey, accountInfo, Edition) as PrintEditionAccount;
  }
}
