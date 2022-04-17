import { Metaplex } from '@/Metaplex';
import { MasterEditionAccount } from '@/programs';
import { OldLoader } from '@/shared';
import { Nft } from './Nft';

export class MasterEditionLoader extends OldLoader<MasterEditionAccount | null> {
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
