import { NftWithToken } from '@/plugins/nftModule';
import { Serializer } from '@/types';
import { Option } from '@/utils';

/** TODO */
export type CandyGuardManifest<
  Settings extends object,
  MintArgs extends Array<unknown> = [],
  MintRemainingAccounts extends Array<unknown> = []
> = {
  name: string;
  settingsBytes: number; // Fixed.
  settingsSerializer: Serializer<Settings>;
  mintArgsSerializer?: Serializer<MintArgs>;
  mintRemainingAccountsSerializer?: Serializer<MintRemainingAccounts>;
  onBeforeMint?: (setting: Settings) => Promise<void>;
  onAfterMint?: (nft: NftWithToken) => Promise<void>;
};

/** TODO */
export type CandyGuardsSettings = {
  [name: string]: Option<object>;
};

/** TODO */
export type CandyGuardsMintSettings = {
  [name: string]: Option<{
    args?: Array<unknown>;
    remainingAccounts?: Array<unknown>;
  }>;
};
