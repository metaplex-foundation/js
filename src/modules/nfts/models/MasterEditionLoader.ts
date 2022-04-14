import { Metaplex } from '../../../Metaplex.js';
import { MasterEditionAccount } from '../../../programs/index.js';
import { Loader } from '../../../shared/index.js';
import { Nft } from './Nft.js';

export class MasterEditionLoader extends Loader<MasterEditionAccount | null> {
  protected nft: Nft;

  constructor(nft: Nft) {
    super();
    this.nft = nft;
  }

  public async handle(metaplex: Metaplex) {
    const masterEditionPda = await MasterEditionAccount.pda(this.nft.mint);
    const masterEditionInfo = await metaplex.getAccountInfo(masterEditionPda);

    if (!masterEditionInfo) {
      return null;
    }

    return MasterEditionAccount.fromAccountInfo(masterEditionInfo);
  }
}
