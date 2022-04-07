import { MetadataAccount, TokenProgram } from '@/programs';
import { GmaBuilder, OperationHandler } from '@/shared';
import { zipMap } from '@/utils';
import { PublicKey } from '@solana/web3.js';
import { Nft } from '../models';
import { FindNftsByOwnerOperation } from '../operations/FindNftsByOwnerOperation';

export class FindNftsByOwnerUsingGpasOperationHandler extends OperationHandler<FindNftsByOwnerOperation> {
  public async handle(operation: FindNftsByOwnerOperation): Promise<Nft[]> {
    const owner = operation.input;

    const tokensAndMints = await TokenProgram.tokenAccounts(this.metaplex.connection)
      .selectMint()
      .whereOwner(owner)
      .whereAmount(1)
      .getAndMap((account) => ({
        token: account.pubkey,
        mint: new PublicKey(account.data),
      }));

    const metadataPdas = await Promise.all(
      tokensAndMints.map(({ mint }) => MetadataAccount.pda(mint))
    );

    const gma = new GmaBuilder(this.metaplex.connection, metadataPdas);
    const metadataInfos = await gma.get();

    const nftsOrNull = zipMap(tokensAndMints, metadataInfos, (tokenAndMint, metadataInfo) => {
      if (!metadataInfo || !metadataInfo.exists) return null;

      try {
        const metadata = MetadataAccount.fromAccountInfo(metadataInfo);
        return new Nft(metadata);
      } catch (error) {
        return null;
      }
    });

    const nfts = nftsOrNull.filter((nft): nft is Nft => nft !== null);

    return nfts;
  }
}
