import { BigNumber, toBigNumber, toOptionBigNumber } from '@/types';
import { assert, Option } from '@/utils';
import { PublicKey } from '@solana/web3.js';
import {
  isOriginalEditionAccount,
  OriginalEditionAccount,
  OriginalOrPrintEditionAccount,
  PrintEditionAccount,
} from '../accounts';

/** @group Models */
export type NftEdition = NftOriginalEdition | NftPrintEdition;

/** @group Model Helpers */
export const isNftEdition = (value: any): value is NftEdition =>
  typeof value === 'object' && value.model === 'nftEdition';

/** @group Model Helpers */
export function assertNftEdition(value: any): asserts value is NftEdition {
  assert(isNftEdition(value), `Expected NftEdition model`);
}

/** @group Model Helpers */
export const toNftEdition = (
  account: OriginalOrPrintEditionAccount
): NftEdition =>
  isOriginalEditionAccount(account)
    ? toNftOriginalEdition(account)
    : toNftPrintEdition(account as PrintEditionAccount);

/** @group Models */
export type NftOriginalEdition = {
  readonly model: 'nftEdition';
  readonly isOriginal: true;
  readonly address: PublicKey;
  readonly supply: BigNumber;
  readonly maxSupply: Option<BigNumber>;
};

/** @group Model Helpers */
export const isNftOriginalEdition = (value: any): value is NftOriginalEdition =>
  isNftEdition(value) && value.isOriginal;

/** @group Model Helpers */
export function assertNftOriginalEdition(
  value: any
): asserts value is NftOriginalEdition {
  assert(isNftOriginalEdition(value), `Expected NftOriginalEdition model`);
}

/** @group Model Helpers */
export const toNftOriginalEdition = (
  account: OriginalEditionAccount
): NftOriginalEdition => ({
  model: 'nftEdition',
  isOriginal: true,
  address: account.publicKey,
  supply: toBigNumber(account.data.supply),
  maxSupply: toOptionBigNumber(account.data.maxSupply),
});

/** @group Models */
export type NftPrintEdition = {
  readonly model: 'nftEdition';
  readonly isOriginal: false;
  readonly address: PublicKey;
  readonly parent: PublicKey;
  readonly number: BigNumber;
};

/** @group Model Helpers */
export const isNftPrintEdition = (value: any): value is NftPrintEdition =>
  isNftEdition(value) && !value.isOriginal;

/** @group Model Helpers */
export function assertNftPrintEdition(
  value: any
): asserts value is NftPrintEdition {
  assert(isNftPrintEdition(value), `Expected NftPrintEdition model`);
}

/** @group Model Helpers */
export const toNftPrintEdition = (
  account: PrintEditionAccount
): NftPrintEdition => ({
  model: 'nftEdition',
  isOriginal: false,
  address: account.publicKey,
  parent: account.data.parent,
  number: toBigNumber(account.data.edition),
});
