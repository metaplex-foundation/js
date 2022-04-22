import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { MasterEditionV1, MasterEditionV2, Edition } from '@metaplex-foundation/mpl-token-metadata';
import { OriginalEditionAccount, PrintEditionAccount } from '@/programs/tokenMetadata';
import { BaseAccount, Pda, UnparsedAccount } from '@/shared';
import { UnexpectedAccountError } from '@/errors';

export class OriginalOrPrintEditionAccount extends BaseAccount<
  MasterEditionV1 | MasterEditionV2 | Edition
> {
  static async pda(mint: PublicKey): Promise<Pda> {
    return OriginalEditionAccount.pda(mint);
  }

  static recognizes(buffer: Buffer): boolean {
    return OriginalEditionAccount.recognizes(buffer) || PrintEditionAccount.recognizes(buffer);
  }

  static from(unparsedAccount: UnparsedAccount) {
    if (!this.recognizes(unparsedAccount.data)) {
      throw new UnexpectedAccountError(
        unparsedAccount.publicKey,
        'MasterEditionV1|MasterEditionV2|EditionV1'
      );
    }

    const account = OriginalEditionAccount.recognizes(unparsedAccount.data)
      ? OriginalEditionAccount.from(unparsedAccount)
      : PrintEditionAccount.from(unparsedAccount);

    return new OriginalOrPrintEditionAccount(account);
  }
}
