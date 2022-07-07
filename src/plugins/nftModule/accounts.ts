import { Buffer } from 'buffer';
import {
  Edition,
  Key,
  MasterEditionV1,
  MasterEditionV2,
  Metadata,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  Account,
  AccountParser,
  getAccountParsingAndAssertingFunction,
  getAccountParsingFunction,
} from '@/types';

export type MetadataAccount = Account<Metadata>;
export const parseMetadataAccount = getAccountParsingFunction(Metadata);
export const toMetadataAccount =
  getAccountParsingAndAssertingFunction(Metadata);

export type OriginalOrPrintEditionAccountData =
  | OriginalEditionAccountData
  | PrintEditionAccountData;
export type OriginalOrPrintEditionAccount =
  Account<OriginalOrPrintEditionAccountData>;

const originalOrPrintEditionAccountParser: AccountParser<OriginalOrPrintEditionAccountData> =
  {
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
  };

export const parseOriginalOrPrintEditionAccount =
  getAccountParsingFunction<OriginalOrPrintEditionAccountData>(
    originalOrPrintEditionAccountParser
  );
export const toOriginalOrPrintEditionAccount =
  getAccountParsingAndAssertingFunction<OriginalOrPrintEditionAccountData>(
    originalOrPrintEditionAccountParser
  );

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

export type OriginalEditionAccountData = MasterEditionV1 | MasterEditionV2;
export type OriginalEditionAccount = Account<OriginalEditionAccountData>;

const originalEditionAccountParser: AccountParser<OriginalEditionAccountData> =
  {
    name: 'MasterEditionV1 | MasterEditionV2',
    deserialize: (data: Buffer, offset = 0) => {
      if (data?.[0] === Key.MasterEditionV1) {
        return MasterEditionV1.deserialize(data, offset);
      } else {
        return MasterEditionV2.deserialize(data, offset);
      }
    },
  };

export const parseOriginalEditionAccount =
  getAccountParsingFunction<OriginalEditionAccountData>(
    originalEditionAccountParser
  );
export const toOriginalEditionAccount =
  getAccountParsingAndAssertingFunction<OriginalEditionAccountData>(
    originalEditionAccountParser
  );

export type PrintEditionAccountData = Edition;
export type PrintEditionAccount = Account<PrintEditionAccountData>;

export const parsePrintEditionAccount = getAccountParsingFunction(Edition);
export const toPrintEditionAccount =
  getAccountParsingAndAssertingFunction(Edition);
