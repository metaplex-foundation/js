import { Metaplex } from '@/Metaplex';
import {
  findMasterEditionV2Pda,
  OriginalOrPrintEditionAccount,
  parseOriginalOrPrintEditionAccount,
} from '@/programs';
import { Task } from '@/utils';
import { Nft } from './Nft';

export type EditionTask = Task<OriginalOrPrintEditionAccount | null>;

export const useEditionTask = (metaplex: Metaplex, nft: Nft): EditionTask =>
  new Task(async () => {
    const pda = findMasterEditionV2Pda(nft.mint);
    const edition = parseOriginalOrPrintEditionAccount(
      await metaplex.rpc().getAccount(pda)
    );

    return edition.exists ? edition : null;
  });
