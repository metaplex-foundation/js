import { Metaplex } from '@/Metaplex';
import { MasterEditionAccount } from '@/programs';
import { useLoader, Loader } from '@/shared';
import { Nft } from './Nft';

export type MasterEditionLoader = Loader<MasterEditionAccount | null>;

export const useMasterEditionLoader = (metaplex: Metaplex, nft: Nft): MasterEditionLoader =>
  useLoader(async () => {
    const masterEditionPda = await MasterEditionAccount.pda(nft.mint);
    const masterEditionInfo = await metaplex.getAccountInfo(masterEditionPda);

    if (!masterEditionInfo) {
      return null;
    }

    return MasterEditionAccount.fromAccountInfo(masterEditionInfo);
  });
