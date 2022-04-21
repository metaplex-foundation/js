import { AccountInfo, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import BN from 'bn.js';
import { EditionMarker } from '@metaplex-foundation/mpl-token-metadata';
import { TokenMetadataProgram } from '@/programs/tokenMetadata';
import { Account, Pda } from '@/shared';

export class EditionMarkerAccount extends Account<EditionMarker> {
  static async pda(mint: PublicKey, edition: BN): Promise<Pda> {
    return Pda.find(TokenMetadataProgram.publicKey, [
      Buffer.from('metadata', 'utf8'),
      TokenMetadataProgram.publicKey.toBuffer(),
      mint.toBuffer(),
      Buffer.from('edition', 'utf8'),
      Buffer.from(edition.div(new BN(248)).toString()),
    ]);
  }

  static fromAccountInfo(
    publicKey: PublicKey,
    accountInfo: AccountInfo<Buffer>
  ): EditionMarkerAccount {
    return this.parseAccountInfo(publicKey, accountInfo, EditionMarker) as EditionMarkerAccount;
  }
}
