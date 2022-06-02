import { Metaplex } from '@/Metaplex';
import { OriginalOrPrintEditionAccount } from '@/programs';
import { Task } from '@/utils';
import { Nft } from './Nft';

export type EditionTask = Task<OriginalOrPrintEditionAccount | null>;

export const useEditionTask = (metaplex: Metaplex, nft: Nft): EditionTask =>
  new Task(async () => {
    const pda = OriginalOrPrintEditionAccount.pda(nft.mint);
    const edition = OriginalOrPrintEditionAccount.fromMaybe(
      await metaplex.rpc().getAccount(pda)
    );

    return edition.exists ? edition : null;
  });
