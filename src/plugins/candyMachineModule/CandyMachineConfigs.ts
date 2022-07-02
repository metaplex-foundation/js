import BN from 'bn.js';
import { Amount, DateTime, toUnixTimestamp } from '@/types';
import { Option } from '@/utils';
import {
  CandyMachineData,
  Creator,
  EndSettings,
  GatekeeperConfig,
  HiddenSettings,
} from '@metaplex-foundation/mpl-candy-machine';
import { PublicKey } from '@solana/web3.js';
import { WhitelistMintSettings } from './CandyMachine';
import { getCandyMachineUuidFromAddress } from './helpers';

export type CandyMachineConfigs = {
  // Data.
  price: Amount;
  sellerFeeBasisPoints: number;
  itemsAvailable: BN | number;

  // Optional Data.
  symbol?: string; // Defaults to empty string.
  maxEditionSupply?: BN | number; // Defaults to 0.
  isMutable?: boolean; // Defaults to true.
  retainAuthority?: boolean; // Defaults to true.
  goLiveDate?: Option<DateTime>; // Defaults to null.
  endSettings?: Option<EndSettings>; // Defaults to null.
  creators?: PublicKey | Creator[]; // Defaults to mx.identity().publicKey.
  hiddenSettings?: Option<HiddenSettings>; // Defaults to null.
  whitelistMintSettings?: Option<WhitelistMintSettings>; // Defaults to null.
  gatekeeper?: Option<GatekeeperConfig>; // Defaults to null.
};

export const getCandyMachineAccountDataFromConfigs = (
  configs: CandyMachineConfigs,
  candyMachineAddress: PublicKey,
  identity: PublicKey
): CandyMachineData => {
  const whitelistMintSettings = configs.whitelistMintSettings
    ? {
        ...configs.whitelistMintSettings,
        discountPrice:
          configs.whitelistMintSettings.discountPrice?.basisPoints ?? null,
      }
    : null;

  const creatorsParam = configs.creators ?? identity;
  const creators = Array.isArray(creatorsParam)
    ? creatorsParam
    : [
        {
          address: creatorsParam,
          verified: false,
          share: 100,
        },
      ];

  return {
    uuid: getCandyMachineUuidFromAddress(candyMachineAddress),
    price: configs.price.basisPoints,
    symbol: configs.symbol ?? '',
    sellerFeeBasisPoints: configs.sellerFeeBasisPoints,
    maxSupply: configs.maxEditionSupply ?? 0,
    isMutable: configs.isMutable ?? true,
    retainAuthority: configs.retainAuthority ?? true,
    goLiveDate: configs.goLiveDate ? toUnixTimestamp(configs.goLiveDate) : null,
    endSettings: configs.endSettings ?? null,
    creators,
    hiddenSettings: configs.hiddenSettings ?? null,
    whitelistMintSettings,
    itemsAvailable: configs.itemsAvailable,
    gatekeeper: configs.gatekeeper ?? null,
  };
};
