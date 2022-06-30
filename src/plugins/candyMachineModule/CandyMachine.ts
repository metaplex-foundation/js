import { PublicKey } from '@solana/web3.js';
import {
  Creator,
  EndSettings,
  GatekeeperConfig,
  HiddenSettings,
  WhitelistMintSettings,
} from '@metaplex-foundation/mpl-candy-machine';
import BN from 'bn.js';
import { CandyMachineAccount } from './accounts';
import { Amount, lamports, UnparsedAccount } from '@/types';
import { getConfigLines } from './internals';
import { assert, Option } from '@/utils';

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
  maxSupply: BN;
  items: CandyMachineItem[];
  itemsAvailable: BN;
  itemsRedeemed: BN;
  itemsMinted: BN;
  isFull: boolean;
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
  const maxSupply = new BN(account.data.data.maxSupply);
  const itemsAvailable = new BN(account.data.data.itemsAvailable);
  const itemsRedeemed = new BN(account.data.itemsRedeemed);
  const items = getConfigLines(unparsedAccount.data);

  return {
    model: 'candyMachine',
    address: account.publicKey,
    authorityAddress: account.data.authority,
    walletAddress: account.data.wallet,
    tokenMintAddress: account.data.tokenMint,
    uuid: account.data.data.uuid,
    price: lamports(account.data.data.price),
    symbol: account.data.data.symbol,
    sellerFeeBasisPoints: account.data.data.sellerFeeBasisPoints,
    isMutable: account.data.data.isMutable,
    retainAuthority: account.data.data.retainAuthority,
    goLiveDate: account.data.data.goLiveDate
      ? new BN(account.data.data.goLiveDate)
      : null,
    maxSupply,
    items,
    itemsAvailable,
    itemsRedeemed,
    itemsMinted: itemsAvailable.sub(itemsRedeemed),
    isFull: itemsAvailable.gte(maxSupply),
    endSettings: account.data.data.endSettings,
    hiddenSettings: account.data.data.hiddenSettings,
    whitelistMintSettings: account.data.data.whitelistMintSettings,
    gatekeeper: account.data.data.gatekeeper,
    creators: account.data.data.creators,
  };
};
