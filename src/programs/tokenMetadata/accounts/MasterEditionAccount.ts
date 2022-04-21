import { AccountInfo, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { MasterEditionV1, MasterEditionV2, Key } from '@metaplex-foundation/mpl-token-metadata';
import { TokenMetadataProgram } from '@/programs/tokenMetadata';
import { Account, Pda } from '@/shared';
import { UnexpectedAccountError } from '@/errors';

export class MasterEditionAccount extends Account<MasterEditionV1 | MasterEditionV2> {
  static async pda(mint: PublicKey): Promise<Pda> {
    return Pda.find(TokenMetadataProgram.publicKey, [
      Buffer.from('metadata', 'utf8'),
      TokenMetadataProgram.publicKey.toBuffer(),
      mint.toBuffer(),
      Buffer.from('edition', 'utf8'),
    ]);
  }

  static fromAccountInfo(
    publicKey: PublicKey,
    accountInfo: AccountInfo<Buffer>
  ): MasterEditionAccount {
    if (accountInfo.data?.[0] === Key.MasterEditionV1) {
      return this.parseAccountInfo(publicKey, accountInfo, MasterEditionV1);
    }

    if (accountInfo.data?.[0] === Key.MasterEditionV2) {
      return this.parseAccountInfo(publicKey, accountInfo, MasterEditionV2);
    }

    throw new UnexpectedAccountError(publicKey, 'MasterEditionV1|MasterEditionV2');
  }
}
