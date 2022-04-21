import { AccountInfo, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { Edition } from '@metaplex-foundation/mpl-token-metadata';
import { TokenMetadataProgram } from '@/programs/tokenMetadata';
import { Account, Pda } from '@/shared';

export class EditionAccount extends Account<Edition> {
  static async pda(mint: PublicKey): Promise<Pda> {
    return Pda.find(TokenMetadataProgram.publicKey, [
      Buffer.from('metadata', 'utf8'),
      TokenMetadataProgram.publicKey.toBuffer(),
      mint.toBuffer(),
      Buffer.from('edition', 'utf8'),
    ]);
  }

  static fromAccountInfo(accountInfo: AccountInfo<Buffer>): EditionAccount {
    return this.parseAccountInfo(accountInfo, Edition) as EditionAccount;
  }
}
