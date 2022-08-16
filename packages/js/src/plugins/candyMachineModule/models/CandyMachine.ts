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
} from '../helpers';
import {
  CandyMachineAccount,
  MaybeCandyMachineCollectionAccount,
} from '../accounts';
import { Creator } from '@/types';
import { CandyMachineProgram } from '../program';

// -----------------
// Model
// -----------------

/** @group Models */
export type CandyMachine = {
  readonly model: 'candyMachine';
  readonly address: PublicKey;
  readonly programAddress: PublicKey;
  readonly version: 1 | 2;
  readonly authorityAddress: PublicKey;
  readonly walletAddress: PublicKey; // SOL treasury OR token account for the tokenMintAddress.
  readonly tokenMintAddress: Option<PublicKey>;
  readonly collectionMintAddress: Option<PublicKey>;
  readonly uuid: string;
  readonly price: Amount;
  readonly symbol: string;
  readonly sellerFeeBasisPoints: number;
  readonly isMutable: boolean;
  readonly retainAuthority: boolean;
  readonly goLiveDate: Option<DateTime>;
  readonly maxEditionSupply: BigNumber;
  readonly items: CandyMachineItem[];
  readonly itemsAvailable: BigNumber;
  readonly itemsMinted: BigNumber;
  readonly itemsRemaining: BigNumber;
  readonly itemsLoaded: BigNumber;
  readonly isFullyLoaded: boolean;
  readonly endSettings: Option<CandyMachineEndSettings>;
  readonly hiddenSettings: Option<CandyMachineHiddenSettings>;
  readonly whitelistMintSettings: Option<CandyMachineWhitelistMintSettings>;
  readonly gatekeeper: Option<CandyMachineGatekeeper>;
  readonly creators: Creator[];
};

/** @group Models */
export type CandyMachineItem = {
  readonly name: string;
  readonly uri: string;
};

/** @group Models */
export type CandyMachineEndSettings =
  | {
      readonly endSettingType: EndSettingType.Amount;
      readonly number: BigNumber;
    }
  | {
      readonly endSettingType: EndSettingType.Date;
      readonly date: DateTime;
    };

/** @group Models */
export type CandyMachineHiddenSettings = {
  readonly name: string;
  readonly uri: string;
  readonly hash: number[];
};

/** @group Models */
export type CandyMachineWhitelistMintSettings = {
  readonly mode: WhitelistMintMode;
  readonly mint: PublicKey;
  readonly presale: boolean;
  readonly discountPrice: Option<Amount>;
};

/** @group Models */
export type CandyMachineGatekeeper = {
  readonly network: PublicKey;
  readonly expireOnUse: boolean;
};

// -----------------
// Program to Model
// -----------------

/** @group Model Helpers */
export const isCandyMachine = (value: any): value is CandyMachine =>
  typeof value === 'object' && value.model === 'candyMachine';

/** @group Model Helpers */
export function assertCandyMachine(value: any): asserts value is CandyMachine {
  assert(isCandyMachine(value), 'Expected CandyMachine type');
}

/** @group Model Helpers */
export const toCandyMachine = (
  account: CandyMachineAccount,
  unparsedAccount: UnparsedAccount,
  collectionAccount: MaybeCandyMachineCollectionAccount | null
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
    programAddress: account.owner,
    version: account.owner.equals(CandyMachineProgram.publicKey) ? 2 : 1,
    authorityAddress: account.data.authority,
    walletAddress: account.data.wallet,
    tokenMintAddress: account.data.tokenMint,
    collectionMintAddress:
      collectionAccount && collectionAccount.exists
        ? collectionAccount.data.mint
        : null,
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

// -----------------
// Model to Configs
// -----------------

/** @group Models */
export type CandyMachineConfigs = {
  wallet: PublicKey;
  tokenMint: Option<PublicKey>;
  price: Amount;
  sellerFeeBasisPoints: number;
  itemsAvailable: BigNumber;
  symbol: string;
  maxEditionSupply: BigNumber;
  isMutable: boolean;
  retainAuthority: boolean;
  goLiveDate: Option<DateTime>;
  endSettings: Option<CandyMachineEndSettings>;
  hiddenSettings: Option<CandyMachineHiddenSettings>;
  whitelistMintSettings: Option<CandyMachineWhitelistMintSettings>;
  gatekeeper: Option<CandyMachineGatekeeper>;
  creators: Creator[];
};

/** @group Model Helpers */
export const toCandyMachineConfigs = (
  candyMachine: CandyMachine
): CandyMachineConfigs => {
  return {
    wallet: candyMachine.walletAddress,
    tokenMint: candyMachine.tokenMintAddress,
    ...candyMachine,
  };
};

// -----------------
// Configs to Program
// -----------------

/** @group Models */
export type CandyMachineInstructionData = {
  wallet: PublicKey;
  tokenMint: Option<PublicKey>;
  data: CandyMachineData;
};

/** @group Model Helpers */
export const toCandyMachineInstructionData = (
  address: PublicKey,
  configs: CandyMachineConfigs
): CandyMachineInstructionData => {
  const endSettings = configs.endSettings;
  const whitelistMintSettings = configs.whitelistMintSettings;
  const gatekeeper = configs.gatekeeper;

  return {
    wallet: configs.wallet,
    tokenMint: configs.tokenMint,
    data: {
      ...configs,
      uuid: getCandyMachineUuidFromAddress(address),
      price: configs.price.basisPoints,
      maxSupply: configs.maxEditionSupply,
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
    },
  };
};
