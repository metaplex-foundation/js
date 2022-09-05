import { NftWithToken } from '@/plugins/nftModule';
import { Serializer } from '@/types';
import { Option } from '@/utils';

/** TODO */
export type CandyGuardManifest<
  Settings extends object = any,
  MintArgs extends Array<unknown> = [],
  MintRemainingAccounts extends Array<unknown> = []
> = {
  name: string;
  settingsSerializer?: Serializer<Settings>;
  mintArgsSerializer?: Serializer<MintArgs>;
  mintRemainingAccountsSerializer?: Serializer<MintRemainingAccounts>;
  onBeforeMint?: () => Promise<void>;
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
