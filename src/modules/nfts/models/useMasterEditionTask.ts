import { Metaplex } from '@/Metaplex';
import { OriginalEditionAccount } from '@/programs';
import { useTask, Task } from '@/shared';
import { Nft } from './Nft';

export type MasterEditionTask = Task<OriginalEditionAccount | null>;

export const useMasterEditionTask = (metaplex: Metaplex, nft: Nft): MasterEditionTask =>
  useTask(async () => {
    const masterEditionPda = await OriginalEditionAccount.pda(nft.mint);
    const masterEditionInfo = await metaplex.rpc().getAccountInfo(masterEditionPda);

    if (!masterEditionInfo) {
      return null;
    }

    return OriginalEditionAccount.from({ publicKey: masterEditionPda, ...masterEditionInfo });
  });
