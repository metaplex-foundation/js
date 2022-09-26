import { Option } from '@/utils';
import { AddressGateGuardSettings } from './addressGate';
import {
  AllowListGuardMintSettings,
  AllowListGuardSettings,
} from './allowList';
import { BotTaxGuardSettings } from './botTax';
import { CandyGuardsMintSettings, CandyGuardsSettings } from './core';
import { EndDateGuardSettings } from './endDate';
import { GatekeeperGuardSettings } from './gatekeeper';
import { MintLimitGuardSettings } from './mintLimit';
import { NftGateGuardSettings } from './nftGate';
import { NftPaymentGuardSettings } from './nftPayment';
import { RedeemedAmountGuardSettings } from './redeemedAmount';
import { SolPaymentGuardSettings } from './solPayment';
import { StartDateGuardSettings } from './startDate';
import {
  ThirdPartySignerGuardMintSettings,
  ThirdPartySignerGuardSettings,
} from './thirdPartySigner';
import { TokenGateGuardSettings } from './tokenGate';
import {
  TokenPaymentGuardMintSettings,
  TokenPaymentGuardSettings,
} from './tokenPayment';

export type DefaultCandyGuardSettings = CandyGuardsSettings & {
  botTax: Option<BotTaxGuardSettings>;
  solPayment: Option<SolPaymentGuardSettings>;
  tokenPayment: Option<TokenPaymentGuardSettings>;
  startDate: Option<StartDateGuardSettings>;
  thirdPartySigner: Option<ThirdPartySignerGuardSettings>;
  tokenGate: Option<TokenGateGuardSettings>;
  gatekeeper: Option<GatekeeperGuardSettings>;
  endDate: Option<EndDateGuardSettings>;
  allowList: Option<AllowListGuardSettings>;
  mintLimit: Option<MintLimitGuardSettings>;
  nftPayment: Option<NftPaymentGuardSettings>;
  redemeedAmount: Option<RedeemedAmountGuardSettings>; // TODO: Rename to "redeemedAmount" when typo fixed on the Program.
  addressGate: Option<AddressGateGuardSettings>;
  nftGate: Option<NftGateGuardSettings>;
  // nftBurn: Option<NftBurnGuardSettings>;
  // tokenBurn: Option<TokenBurnGuardSettings>;
};

export type DefaultCandyGuardMintSettings = CandyGuardsMintSettings & {
  // botTax: no mint settings
  // solPayment: no mint settings
  tokenPayment: Option<TokenPaymentGuardMintSettings>;
  // startDate: no mint settings
  thirdPartySigner: Option<ThirdPartySignerGuardMintSettings>;
  tokenGate: Option<{}>; // TODO
  gatekeeper: Option<{}>; // TODO
  endDate: Option<{}>; // TODO
  allowList: Option<AllowListGuardMintSettings>;
  // mintLimit: no mint settings
  nftPayment: Option<{}>; // TODO
  redeemedAmount: Option<{}>; // TODO
  addressGate: Option<{}>; // TODO
  nftGate: Option<{}>; // TODO
  // nftBurn: Option<{}>; // TODO
  // tokenBurn: Option<{}>; // TODO
};

/** @internal */
export const defaultCandyGuardNames: string[] = [
  'botTax',
  'solPayment',
  'tokenPayment',
  'startDate',
  'thirdPartySigner',
  'tokenGate',
  'gatekeeper',
  'endDate',
  'allowList',
  'mintLimit',
  'nftPayment',
  'redemeedAmount', // TODO: Rename to "redeemedAmount" when typo fixed on the Program.
  'addressGate',
  'nftGate',
  // 'nftBurn',
  // 'tokenBurn',
];

/** @internal */
export const emptyDefaultCandyGuardSettings: {
  [key in keyof DefaultCandyGuardSettings]: null;
} = defaultCandyGuardNames.reduce((acc, name) => {
  acc[name] = null;
  return acc;
}, {} as { [key in keyof DefaultCandyGuardSettings]: null });
