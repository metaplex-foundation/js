import { AccountInfo, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { MasterEditionV1, MasterEditionV2, Edition } from '@metaplex-foundation/mpl-token-metadata';
import { OriginalEditionAccount, PrintEditionAccount } from '@/programs/tokenMetadata';
import { Account, Pda } from '@/shared';
import { UnexpectedAccountError } from '@/errors';

export class OriginalOrPrintEditionAccount extends Account<
  MasterEditionV1 | MasterEditionV2 | Edition
> {
  static async pda(mint: PublicKey): Promise<Pda> {
    return OriginalEditionAccount.pda(mint);
  }

  static recognizes(buffer: Buffer): boolean {
    return OriginalEditionAccount.recognizes(buffer) || PrintEditionAccount.recognizes(buffer);
  }

  static fromAccountInfo(
    publicKey: PublicKey,
    accountInfo: AccountInfo<Buffer>
  ): OriginalOrPrintEditionAccount {
    if (OriginalEditionAccount.recognizes(accountInfo.data)) {
      return OriginalEditionAccount.fromAccountInfo(publicKey, accountInfo);
    }

    if (PrintEditionAccount.recognizes(accountInfo.data)) {
      return PrintEditionAccount.fromAccountInfo(publicKey, accountInfo);
    }

    throw new UnexpectedAccountError(publicKey, 'MasterEditionV1|MasterEditionV2|EditionV1');
  }
}
