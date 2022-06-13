import { Buffer } from 'buffer';
import {
  Edition,
  Key,
  MasterEditionV1,
  MasterEditionV2,
} from '@metaplex-foundation/mpl-token-metadata';
import { Account, getAccountParsingFunction } from '@/types';

export type OriginalEditionAccount = Account<MasterEditionV1 | MasterEditionV2>;
export type PrintEditionAccount = Account<Edition>;
export type OriginalOrPrintEditionAccount =
  | OriginalEditionAccount
  | PrintEditionAccount;

export const parseOriginalEditionAccount = getAccountParsingFunction({
  name: 'MasterEditionV1 | MasterEditionV2',
  deserialize: (data: Buffer, offset = 0) => {
    if (data?.[0] === Key.MasterEditionV1) {
      return MasterEditionV1.deserialize(data, offset);
    } else {
      return MasterEditionV2.deserialize(data, offset);
    }
  },
});

export const isOriginalEditionAccount = (
  account: OriginalOrPrintEditionAccount
): account is OriginalEditionAccount => {
  return 'maxSupply' in account.data;
};

export const isPrintEditionAccount = (
  account: OriginalOrPrintEditionAccount
): account is PrintEditionAccount => {
  return !isOriginalEditionAccount(account);
};
