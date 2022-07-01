import { PublicKey } from '@solana/web3.js';
import {
  Creator,
  EndSettings,
  GatekeeperConfig,
  HiddenSettings,
  WhitelistMintSettings as BaseWhitelistMintSettings,
} from '@metaplex-foundation/mpl-candy-machine';
import BN from 'bn.js';
import { Amount, lamports, UnparsedAccount } from '@/types';
import { assert, Option, removeEmptyChars } from '@/utils';
import { getConfigLinesCount, parseConfigLines } from './helpers';
import { CandyMachineAccount } from './accounts';

export type CandyMachine = Readonly<{
  model: 'candyMachine';
  address: PublicKey;
  authorityAddress: PublicKey;
  walletAddress: PublicKey;
  tokenMintAddress: Option<PublicKey>;
  uuid: string;
  price: Amount;
  symbol: string;
  sellerFeeBasisPoints: number;
  isMutable: boolean;
  retainAuthority: boolean;
  goLiveDate: Option<BN>;
  maxEditionSupply: BN;
  items: CandyMachineItem[];
  itemsAvailable: number;
  itemsMinted: number;
  itemsRemaining: number;
  itemsLoaded: number;
  isFullyLoaded: boolean;
  endSettings: Option<EndSettings>;
  hiddenSettings: Option<HiddenSettings>;
  whitelistMintSettings: Option<WhitelistMintSettings>;
  gatekeeper: Option<GatekeeperConfig>;
  creators: Creator[];
}>;

export type CandyMachineItem = Readonly<{
  name: string;
  uri: string;
}>;

export type WhitelistMintSettings = Omit<
  BaseWhitelistMintSettings,
  'discountPrice'
> & {
  discountPrice: Option<Amount>;
};

export const isCandyMachineModel = (value: any): value is CandyMachine =>
  typeof value === 'object' && value.model === 'candyMachine';

export const assertCandyMachineModel = (
  value: any
): asserts value is CandyMachine =>
  assert(isCandyMachineModel(value), `Expected CandyMachine type`);

export const makeCandyMachineModel = (
  account: CandyMachineAccount,
  unparsedAccount: UnparsedAccount
): CandyMachine => {
  const itemsAvailable = new BN(account.data.data.itemsAvailable).toNumber();
  const itemsMinted = new BN(account.data.itemsRedeemed).toNumber();
  const itemsLoaded = getConfigLinesCount(unparsedAccount.data);
  const items = parseConfigLines(unparsedAccount.data);

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
    goLiveDate: account.data.data.goLiveDate
      ? new BN(account.data.data.goLiveDate)
      : null,
    maxEditionSupply: new BN(account.data.data.maxSupply),
    items,
    itemsAvailable,
    itemsMinted,
    itemsRemaining: itemsAvailable - itemsMinted,
    itemsLoaded,
    isFullyLoaded: itemsAvailable <= itemsLoaded,
    endSettings: account.data.data.endSettings,
    hiddenSettings: account.data.data.hiddenSettings,
    whitelistMintSettings: account.data.data.whitelistMintSettings
      ? {
          ...account.data.data.whitelistMintSettings,
          discountPrice: account.data.data.whitelistMintSettings.discountPrice
            ? lamports(account.data.data.whitelistMintSettings.discountPrice)
            : null,
        }
      : null,
    gatekeeper: account.data.data.gatekeeper,
    creators: account.data.data.creators,
  };
};
