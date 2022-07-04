import { PublicKey } from '@solana/web3.js';
import {
  CandyMachineData,
  EndSettingType,
  WhitelistMintMode,
} from '@metaplex-foundation/mpl-candy-machine';
import {
  Amount,
  BigNumber,
  DateTime,
  lamports,
  toBigNumber,
  toDateTime,
  toOptionDateTime,
  UnparsedAccount,
} from '@/types';
import { assert, Option, removeEmptyChars } from '@/utils';
import {
  countCandyMachineItems,
  getCandyMachineUuidFromAddress,
  parseCandyMachineItems,
} from './helpers';
import { CandyMachineAccount } from './accounts';
import { Creator } from '@/types/Creator';

export type CandyMachine = Readonly<{
  model: 'candyMachine';
  address: PublicKey;
  authorityAddress: PublicKey;
  walletAddress: PublicKey; // SOL treasury OR token account for the tokenMintAddress.
  tokenMintAddress: Option<PublicKey>;
  uuid: string;
  price: Amount;
  symbol: string;
  sellerFeeBasisPoints: number;
  isMutable: boolean;
  retainAuthority: boolean;
  goLiveDate: Option<DateTime>;
  maxEditionSupply: BigNumber;
  items: CandyMachineItem[];
  itemsAvailable: BigNumber;
  itemsMinted: BigNumber;
  itemsRemaining: BigNumber;
  itemsLoaded: BigNumber;
  isFullyLoaded: boolean;
  endSettings: Option<EndSettings>;
  hiddenSettings: Option<HiddenSettings>;
  whitelistMintSettings: Option<WhitelistMintSettings>;
  gatekeeper: Option<Gatekeeper>;
  creators: Creator[];
}>;

export type CandyMachineItem = Readonly<{
  name: string;
  uri: string;
}>;

export type EndSettings =
  | {
      endSettingType: EndSettingType.Amount;
      number: BigNumber;
    }
  | {
      endSettingType: EndSettingType.Date;
      date: DateTime;
    };

export type HiddenSettings = {
  name: string;
  uri: string;
  hash: number[];
};

export type WhitelistMintSettings = {
  mode: WhitelistMintMode;
  mint: PublicKey;
  presale: boolean;
  discountPrice: Option<Amount>;
};

export type Gatekeeper = {
  network: PublicKey;
  expireOnUse: boolean;
};

export type CandyMachineUpdatableFields =
  | 'price'
  | 'sellerFeeBasisPoints'
  | 'itemsAvailable'
  | 'symbol'
  | 'maxEditionSupply'
  | 'isMutable'
  | 'retainAuthority'
  | 'goLiveDate'
  | 'endSettings'
  | 'creators'
  | 'hiddenSettings'
  | 'whitelistMintSettings'
  | 'gatekeeper';

export const isCandyMachine = (value: any): value is CandyMachine =>
  typeof value === 'object' && value.model === 'candyMachine';

export const assertCandyMachine = (value: any): asserts value is CandyMachine =>
  assert(isCandyMachine(value), 'Expected CandyMachine type');

// From Program to SDK.

export const toCandyMachine = (
  account: CandyMachineAccount,
  unparsedAccount: UnparsedAccount
): CandyMachine => {
  const itemsAvailable = toBigNumber(account.data.data.itemsAvailable);
  const itemsMinted = toBigNumber(account.data.itemsRedeemed);

  const endSettings = account.data.data.endSettings;
  const hiddenSettings = account.data.data.hiddenSettings;
  const whitelistMintSettings = account.data.data.whitelistMintSettings;
  const gatekeeper = account.data.data.gatekeeper;

  const rawData = unparsedAccount.data;
  const itemsLoaded = hiddenSettings
    ? toBigNumber(0)
    : countCandyMachineItems(rawData);
  const items = hiddenSettings ? [] : parseCandyMachineItems(rawData);

  return {
    model: 'candyMachine',
    address: account.publicKey,
    authorityAddress: account.data.authority,
    walletAddress: account.data.wallet,
    tokenMintAddress: account.data.tokenMint,
    uuid: account.data.data.uuid,
    price: lamports(account.data.data.price),
    symbol: removeEmptyChars(account.data.data.symbol),
    sellerFeeBasisPoints: account.data.data.sellerFeeBasisPoints,
    isMutable: account.data.data.isMutable,
    retainAuthority: account.data.data.retainAuthority,
    goLiveDate: toOptionDateTime(account.data.data.goLiveDate),
    maxEditionSupply: toBigNumber(account.data.data.maxSupply),
    items,
    itemsAvailable,
    itemsMinted,
    itemsRemaining: toBigNumber(itemsAvailable.sub(itemsMinted)),
    itemsLoaded,
    isFullyLoaded: itemsAvailable.lte(itemsLoaded),
    endSettings: endSettings
      ? endSettings.endSettingType === EndSettingType.Date
        ? {
            endSettingType: EndSettingType.Date,
            date: toDateTime(endSettings.number),
          }
        : {
            endSettingType: EndSettingType.Amount,
            number: toBigNumber(endSettings.number),
          }
      : null,
    hiddenSettings,
    whitelistMintSettings: whitelistMintSettings
      ? {
          ...whitelistMintSettings,
          discountPrice: whitelistMintSettings.discountPrice
            ? lamports(whitelistMintSettings.discountPrice)
            : null,
        }
      : null,
    gatekeeper: gatekeeper
      ? {
          ...gatekeeper,
          network: gatekeeper.gatekeeperNetwork,
        }
      : null,
    creators: account.data.data.creators,
  };
};

// From SDK to Program.

export const toCandyMachineInstructionData = (
  candyMachine: Pick<CandyMachine, CandyMachineUpdatableFields | 'address'>
): CandyMachineData => {
  const endSettings = candyMachine.endSettings;
  const whitelistMintSettings = candyMachine.whitelistMintSettings;
  const gatekeeper = candyMachine.gatekeeper;

  return {
    ...candyMachine,
    uuid: getCandyMachineUuidFromAddress(candyMachine.address),
    price: candyMachine.price.basisPoints,
    maxSupply: candyMachine.maxEditionSupply,
    endSettings: endSettings
      ? {
          ...endSettings,
          number:
            endSettings.endSettingType === EndSettingType.Date
              ? endSettings.date
              : endSettings.number,
        }
      : null,
    whitelistMintSettings: whitelistMintSettings
      ? {
          ...whitelistMintSettings,
          discountPrice:
            whitelistMintSettings.discountPrice?.basisPoints ?? null,
        }
      : null,
    gatekeeper: gatekeeper
      ? {
          ...gatekeeper,
          gatekeeperNetwork: gatekeeper.network,
        }
      : null,
  };
};
