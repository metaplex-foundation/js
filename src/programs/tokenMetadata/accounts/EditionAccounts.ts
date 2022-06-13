import { Buffer } from 'buffer';
import {
  Edition,
  Key,
  MasterEditionV1,
  MasterEditionV2,
} from '@metaplex-foundation/mpl-token-metadata';
import { Account, getAccountParsingFunction } from '@/types';

export type OriginalEditionAccountData = MasterEditionV1 | MasterEditionV2;
export type OriginalEditionAccount = Account<OriginalEditionAccountData>;

export type PrintEditionAccountData = Edition;
export type PrintEditionAccount = Account<PrintEditionAccountData>;

export type OriginalOrPrintEditionAccountData =
  | OriginalEditionAccountData
  | PrintEditionAccountData;
export type OriginalOrPrintEditionAccount =
  Account<OriginalOrPrintEditionAccountData>;

export const parseOriginalOrPrintEditionAccount =
  getAccountParsingFunction<OriginalOrPrintEditionAccountData>({
    name: 'MasterEditionV1 | MasterEditionV2 | Edition',
    deserialize: (data: Buffer, offset = 0) => {
      if (data?.[0] === Key.MasterEditionV1) {
        return MasterEditionV1.deserialize(data, offset);
      } else if (data?.[0] === Key.MasterEditionV2) {
        return MasterEditionV2.deserialize(data, offset);
      } else {
        return Edition.deserialize(data, offset);
      }
    },
  });

export const parseOriginalEditionAccount =
  getAccountParsingFunction<OriginalEditionAccountData>({
    name: 'MasterEditionV1 | MasterEditionV2',
    deserialize: (data: Buffer, offset = 0) => {
      if (data?.[0] === Key.MasterEditionV1) {
        return MasterEditionV1.deserialize(data, offset);
      } else {
        return MasterEditionV2.deserialize(data, offset);
      }
    },
  });

export const parsePrintEditionAccount = getAccountParsingFunction(Edition);

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
