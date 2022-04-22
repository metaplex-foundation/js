import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { MasterEditionV1, MasterEditionV2, Key } from '@metaplex-foundation/mpl-token-metadata';
import { TokenMetadataProgram } from '@/programs/tokenMetadata';
import { BaseAccount, Pda, UnparsedAccount } from '@/shared';
import { UnexpectedAccountError } from '@/errors';

export class OriginalEditionAccount extends BaseAccount<MasterEditionV1 | MasterEditionV2> {
  static async pda(mint: PublicKey): Promise<Pda> {
    return Pda.find(TokenMetadataProgram.publicKey, [
      Buffer.from('metadata', 'utf8'),
      TokenMetadataProgram.publicKey.toBuffer(),
      mint.toBuffer(),
      Buffer.from('edition', 'utf8'),
    ]);
  }

  static recognizes(buffer: Buffer): boolean {
    return this.recognizesV1(buffer) || this.recognizesV2(buffer);
  }

  static recognizesV1(buffer: Buffer): boolean {
    return buffer?.[0] === Key.MasterEditionV1;
  }

  static recognizesV2(buffer: Buffer): boolean {
    return buffer?.[0] === Key.MasterEditionV2;
  }

  static from(unparsedAccount: UnparsedAccount) {
    if (!this.recognizes(unparsedAccount.data)) {
      throw new UnexpectedAccountError(
        unparsedAccount.publicKey,
        'MasterEditionV1|MasterEditionV2'
      );
    }

    const accountData = this.recognizesV1(unparsedAccount.data) ? MasterEditionV1 : MasterEditionV2;
    return new OriginalEditionAccount(this.parse(unparsedAccount, accountData));
  }
}
