import { AccountInfo, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { TokenMetadataProgram } from '@/programs/tokenMetadata/index';
import { Account, Pda } from '@/shared/index';

export class MetadataAccount extends Account<Metadata> {
  static async pda(mint: PublicKey): Promise<Pda> {
    return Pda.find(TokenMetadataProgram.publicKey, [
      Buffer.from('metadata', 'utf8'),
      TokenMetadataProgram.publicKey.toBuffer(),
      mint.toBuffer(),
    ]);
  }

  static fromAccountInfo(accountInfo: AccountInfo<Buffer>): MetadataAccount {
    return this.parseAccountInfo(accountInfo, Metadata) as MetadataAccount;
  }
}
