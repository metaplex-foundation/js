import { Option } from '@/utils';
import {
  AllowListGuardMintSettings,
  AllowListGuardSettings,
} from './allowList';
import { BotTaxGuardSettings } from './botTax';
import { CandyGuardsMintSettings, CandyGuardsSettings } from './core';
import { EndDateGuardSettings } from './endDate';
import { GatekeeperGuardSettings } from './gatekeeper';
import { SolPaymentGuardSettings } from './solPayment';
import { MintLimitGuardSettings } from './mintLimit';
import { NftPaymentGuardSettings } from './nftPayment';
import {
  TokenPaymentGuardMintSettings,
  TokenPaymentGuardSettings,
} from './tokenPayment';
import {
  ThirdPartySignerGuardMintSettings,
  ThirdPartySignerGuardSettings,
} from './thirdPartySigner';
import { StartDateGuardSettings } from './startDate';
import { TokenGateGuardSettings } from './tokenGate';

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
};

export type DefaultCandyGuardMintSettings = CandyGuardsMintSettings & {
  // botTax: no mint settings
  // solPayment: no mint settings
  splToken: Option<TokenPaymentGuardMintSettings>;
  // liveDate: no mint settings
  thirdPartySigner: Option<ThirdPartySignerGuardMintSettings>;
  tokenGate: Option<{}>; // TODO
  gatekeeper: Option<{}>; // TODO
  endDate: Option<{}>; // TODO
  allowList: Option<AllowListGuardMintSettings>;
  // mintLimit: no mint settings
  nftPayment: Option<{}>; // TODO
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
];

/** @internal */
export const emptyDefaultCandyGuardSettings: {
  [key in keyof DefaultCandyGuardSettings]: null;
} = defaultCandyGuardNames.reduce((acc, name) => {
  acc[name] = null;
  return acc;
}, {} as { [key in keyof DefaultCandyGuardSettings]: null });
