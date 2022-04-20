import { Metaplex } from '@/Metaplex';
import { MasterEditionAccount } from '@/programs';
import { useTask, Task } from '@/shared';
import { Nft } from './Nft';

export type MasterEditionTask = Task<MasterEditionAccount | null>;

export const useMasterEditionTask = (metaplex: Metaplex, nft: Nft): MasterEditionTask =>
  useTask(async () => {
    const masterEditionPda = await MasterEditionAccount.pda(nft.mint);
    const masterEditionInfo = await metaplex.rpc().getAccountInfo(masterEditionPda);

    if (!masterEditionInfo) {
      return null;
    }

    return MasterEditionAccount.fromAccountInfo(masterEditionInfo);
  });
