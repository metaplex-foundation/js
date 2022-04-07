import { Metaplex } from '@/Metaplex';
import { MasterEditionAccount } from '@/programs';
import { Loader } from '@/shared';
import { Nft } from './Nft';

export class MasterEditionLoader extends Loader<MasterEditionAccount> {
  protected nft: Nft;

  constructor(nft: Nft) {
    super();
    this.nft = nft;
  }

  public async handle(metaplex: Metaplex) {
    const masterEditionPda = await MasterEditionAccount.pda(this.nft.mint);
    const masterEditionInfo = await metaplex.getAccountInfo(masterEditionPda);

    if (!masterEditionInfo) {
      // TODO: Custom errors.
      throw new Error('Master edition not found');
    }

    return MasterEditionAccount.fromAccountInfo(masterEditionInfo);
  }
}
