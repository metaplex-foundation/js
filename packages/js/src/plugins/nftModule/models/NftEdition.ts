import { PublicKey } from '@solana/web3.js';
import { assert, Option } from '@/utils';
import {
  isOriginalEditionAccount,
  OriginalEditionAccount,
  OriginalOrPrintEditionAccount,
  PrintEditionAccount,
} from './accounts';
import { BigNumber, toBigNumber, toOptionBigNumber } from '@/types';

export type NftEdition = NftOriginalEdition | NftPrintEdition;

export const isNftEdition = (value: any): value is NftEdition =>
  typeof value === 'object' && value.model === 'nftEdition';

export function assertNftEdition(value: any): asserts value is NftEdition {
  assert(isNftEdition(value), `Expected NftEdition model`);
}
export const toNftEdition = (
  account: OriginalOrPrintEditionAccount
): NftEdition =>
  isOriginalEditionAccount(account)
    ? toNftOriginalEdition(account)
    : toNftPrintEdition(account as PrintEditionAccount);

export type NftOriginalEdition = {
  readonly model: 'nftEdition';
  readonly isOriginal: true;
  readonly address: PublicKey;
  readonly supply: BigNumber;
  readonly maxSupply: Option<BigNumber>;
};

export const isNftOriginalEdition = (value: any): value is NftOriginalEdition =>
  isNftEdition(value) && value.isOriginal;

export function assertNftOriginalEdition(
  value: any
): asserts value is NftOriginalEdition {
  assert(isNftOriginalEdition(value), `Expected NftOriginalEdition model`);
}

export const toNftOriginalEdition = (
  account: OriginalEditionAccount
): NftOriginalEdition => ({
  model: 'nftEdition',
  isOriginal: true,
  address: account.publicKey,
  supply: toBigNumber(account.data.supply),
  maxSupply: toOptionBigNumber(account.data.maxSupply),
});

export type NftPrintEdition = {
  readonly model: 'nftEdition';
  readonly isOriginal: false;
  readonly address: PublicKey;
  readonly parent: PublicKey;
  readonly number: BigNumber;
};

export const isNftPrintEdition = (value: any): value is NftPrintEdition =>
  isNftEdition(value) && !value.isOriginal;

export function assertNftPrintEdition(
  value: any
): asserts value is NftPrintEdition {
  assert(isNftPrintEdition(value), `Expected NftPrintEdition model`);
}

export const toNftPrintEdition = (
  account: PrintEditionAccount
): NftPrintEdition => ({
  model: 'nftEdition',
  isOriginal: false,
  address: account.publicKey,
  parent: account.data.parent,
  number: toBigNumber(account.data.edition),
});
