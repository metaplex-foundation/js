import { NftWithToken } from '@/plugins/nftModule';
import { PublicKey, Serializer } from '@/types';
import { Option } from '@/utils';
import { Buffer } from 'buffer';

/** TODO */
export type CandyGuardManifest<
  Settings extends object,
  MintSettings extends object = {}
> = {
  name: string;
  settingsBytes: number; // Fixed.
  settingsSerializer: Serializer<Settings>;
  mintSettingsParser?: (
    mintSettings: MintSettings,
    setting: Settings
  ) => {
    remainingAccounts: PublicKey[];
    arguments: Buffer;
  };
  onBeforeMint?: (setting: Settings) => Promise<void> | void;
  onAfterMint?: (nft: NftWithToken) => Promise<void> | void;
};

/** TODO */
export type CandyGuardsSettings = {
  [name: string]: Option<object>;
};

/** TODO */
export type CandyGuardsMintSettings = {
  [name: string]: Option<object>;
};
