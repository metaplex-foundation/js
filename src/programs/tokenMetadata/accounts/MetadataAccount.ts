import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { TokenMetadataProgram } from '@/programs/tokenMetadata';
import { BaseAccount, Pda, UnparsedAccount } from '@/shared';

export class MetadataAccount extends BaseAccount<Metadata> {
  static async pda(mint: PublicKey): Promise<Pda> {
    return Pda.find(TokenMetadataProgram.publicKey, [
      Buffer.from('metadata', 'utf8'),
      TokenMetadataProgram.publicKey.toBuffer(),
      mint.toBuffer(),
    ]);
  }

  static from(unparsedAccount: UnparsedAccount) {
    return new MetadataAccount(this.parse(unparsedAccount, Metadata));
  }
}
