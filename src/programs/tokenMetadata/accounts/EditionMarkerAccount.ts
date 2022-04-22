import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import BN from 'bn.js';
import { EditionMarker } from '@metaplex-foundation/mpl-token-metadata';
import { TokenMetadataProgram } from '@/programs/tokenMetadata';
import { BaseAccount, Pda, UnparsedAccount } from '@/shared';

export class EditionMarkerAccount extends BaseAccount<EditionMarker> {
  static async pda(mint: PublicKey, edition: BN): Promise<Pda> {
    return Pda.find(TokenMetadataProgram.publicKey, [
      Buffer.from('metadata', 'utf8'),
      TokenMetadataProgram.publicKey.toBuffer(),
      mint.toBuffer(),
      Buffer.from('edition', 'utf8'),
      Buffer.from(edition.div(new BN(248)).toString()),
    ]);
  }

  static from(unparsedAccount: UnparsedAccount) {
    return new EditionMarkerAccount(this.parse(unparsedAccount, EditionMarker));
  }
}
