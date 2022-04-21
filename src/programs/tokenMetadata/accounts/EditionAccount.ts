import { AccountInfo, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { Edition } from '@metaplex-foundation/mpl-token-metadata';
import { MasterEditionAccount } from './MasterEditionAccount';
import { Account, Pda } from '@/shared';

export class EditionAccount extends Account<Edition> {
  static async pda(mint: PublicKey): Promise<Pda> {
    return MasterEditionAccount.pda(mint);
  }

  static fromAccountInfo(publicKey: PublicKey, accountInfo: AccountInfo<Buffer>): EditionAccount {
    return this.parseAccountInfo(publicKey, accountInfo, Edition) as EditionAccount;
  }
}
