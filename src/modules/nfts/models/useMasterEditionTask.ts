import { Metaplex } from '@/Metaplex';
import { OriginalEditionAccount } from '@/programs';
import { useTask, Task } from '@/shared';
import { Nft } from './Nft';

export type MasterEditionTask = Task<OriginalEditionAccount | null>;

export const useMasterEditionTask = (metaplex: Metaplex, nft: Nft): MasterEditionTask =>
  useTask(async () => {
    const masterEditionPda = await OriginalEditionAccount.pda(nft.mint);
    const masterEdition = await metaplex.rpc().getAccount(masterEditionPda);

    if (!masterEdition.exists) {
      return null;
    }

    return OriginalEditionAccount.from(masterEdition);
  });
