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
  settingsSerializer: Serializer<Option<Settings>>;
  mintArgsSerializer?: Serializer<MintArgs>;
  mintRemainingAccountsSerializer?: Serializer<MintRemainingAccounts>;
  onBeforeMint?: (setting: Option<Settings>) => Promise<void>;
  onAfterMint?: (nft: NftWithToken) => Promise<void>;
};

/** TODO */
export type CandyGuardsSettings = {
  [name: string]: Option<object>;
};

/** TODO */
export type CandyGuardsMintSettings = {
  [name: string]: {
    args?: Array<unknown>;
    remainingAccounts?: Array<unknown>;
  };
};
