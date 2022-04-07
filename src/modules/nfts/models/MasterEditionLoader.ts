import { bignum } from '@metaplex-foundation/beet';
import { Metaplex } from '@/Metaplex';
import { MasterEditionAccount } from '@/programs';
import { Loader } from '@/shared';
import { Nft } from './Nft';

export class MasterEditionLoader extends Loader {
  protected nft: Nft;
  public supply?: bignum;
  public maxSupply?: bignum | null;

  constructor(nft: Nft) {
    super();
    this.nft = nft;
  }

  public async handle(metaplex: Metaplex) {
    const masterEditionPda = await MasterEditionAccount.pda(this.nft.mint);
    const masterEditionInfo = await metaplex.getAccountInfo(masterEditionPda);
    const masterEditionAccount = masterEditionInfo
      ? MasterEditionAccount.fromAccountInfo(masterEditionInfo)
      : null;

    this.supply = masterEditionAccount?.data.supply;
    this.maxSupply = masterEditionAccount?.data.maxSupply;
  }

  reset() {
    super.reset();
    this.supply = undefined;
    this.maxSupply = undefined;
  }
}
