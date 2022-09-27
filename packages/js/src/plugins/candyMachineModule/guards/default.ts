import { Option } from '@/utils';
import { AddressGateGuardSettings } from './addressGate';
import {
  AllowListGuardMintSettings,
  AllowListGuardSettings,
} from './allowList';
import { BotTaxGuardSettings } from './botTax';
import { CandyGuardsMintSettings, CandyGuardsSettings } from './core';
import { EndDateGuardSettings } from './endDate';
import {
  GatekeeperGuardMintSettings,
  GatekeeperGuardSettings,
} from './gatekeeper';
import { MintLimitGuardSettings } from './mintLimit';
import { NftBurnGuardMintSettings, NftBurnGuardSettings } from './nftBurn';
import { NftGateGuardMintSettings, NftGateGuardSettings } from './nftGate';
import {
  NftPaymentGuardMintSettings,
  NftPaymentGuardSettings,
} from './nftPayment';
import { RedeemedAmountGuardSettings } from './redeemedAmount';
import { SolPaymentGuardSettings } from './solPayment';
import { StartDateGuardSettings } from './startDate';
import {
  ThirdPartySignerGuardMintSettings,
  ThirdPartySignerGuardSettings,
} from './thirdPartySigner';
import {
  TokenBurnGuardMintSettings,
  TokenBurnGuardSettings,
} from './tokenBurn';
import {
  TokenGateGuardMintSettings,
  TokenGateGuardSettings,
} from './tokenGate';
import {
  TokenPaymentGuardMintSettings,
  TokenPaymentGuardSettings,
} from './tokenPayment';

/**
 * The settings for all default Candy Machine guards.
 */
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
  redeemedAmount: Option<RedeemedAmountGuardSettings>;
  addressGate: Option<AddressGateGuardSettings>;
  nftGate: Option<NftGateGuardSettings>;
  nftBurn: Option<NftBurnGuardSettings>;
  tokenBurn: Option<TokenBurnGuardSettings>;
};

/**
 * The mint settings for all default Candy Machine guards.
 */
export type DefaultCandyGuardMintSettings = CandyGuardsMintSettings & {
  // botTax: no mint settings
  // solPayment: no mint settings
  tokenPayment: Option<TokenPaymentGuardMintSettings>;
  // startDate: no mint settings
  thirdPartySigner: Option<ThirdPartySignerGuardMintSettings>;
  tokenGate: Option<TokenGateGuardMintSettings>;
  gatekeeper: Option<GatekeeperGuardMintSettings>;
  // endDate: no mint settings
  allowList: Option<AllowListGuardMintSettings>;
  // mintLimit: no mint settings
  nftPayment: Option<NftPaymentGuardMintSettings>; // TODO
  // redeemedAmount: no mint settings
  // addressGate: no mint settings
  nftGate: Option<NftGateGuardMintSettings>;
  nftBurn: Option<NftBurnGuardMintSettings>;
  tokenBurn: Option<TokenBurnGuardMintSettings>;
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
  'redeemedAmount',
  'addressGate',
  'nftGate',
  'nftBurn',
  'tokenBurn',
];

/** @internal */
export const emptyDefaultCandyGuardSettings: {
  [key in keyof DefaultCandyGuardSettings]: null;
} = defaultCandyGuardNames.reduce((acc, name) => {
  acc[name] = null;
  return acc;
}, {} as { [key in keyof DefaultCandyGuardSettings]: null });