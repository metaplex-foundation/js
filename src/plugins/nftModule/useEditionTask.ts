import { Metaplex } from '@/Metaplex';
import { OriginalOrPrintEditionAccount } from '@/programs';
import { useTask, Task } from '@/utils';
import { Nft } from './Nft';

export type EditionTask = Task<OriginalOrPrintEditionAccount | null>;

export const useEditionTask = (metaplex: Metaplex, nft: Nft): EditionTask =>
  useTask(async () => {
    const pda = await OriginalOrPrintEditionAccount.pda(nft.mint);
    const edition = OriginalOrPrintEditionAccount.fromMaybe(
      await metaplex.rpc().getAccount(pda)
    );

    return edition.exists ? edition : null;
  });
