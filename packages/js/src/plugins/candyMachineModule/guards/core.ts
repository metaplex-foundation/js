import { NftWithToken } from '@/plugins/nftModule';
import { PublicKey, Serializer, Signer } from '@/types';
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
    settings: Settings,
    mintSettings: Option<MintSettings>
  ) => {
    arguments: Buffer;
    remainingAccounts: (
      | {
          isSigner: false;
          address: PublicKey;
          isWritable: boolean;
        }
      | {
          isSigner: true;
          address: Signer;
          isWritable: boolean;
        }
    )[];
  };
  onBeforeMint?: (
    setting: Settings,
    mintSettings: Option<MintSettings>
  ) => Promise<void> | void;
  onAfterMint?: (
    nft: NftWithToken,
    setting: Settings,
    mintSettings: Option<MintSettings>
  ) => Promise<void> | void;
};

/** TODO */
export type CandyGuardsSettings = {
  [name: string]: Option<object>;
};

/** TODO */
export type CandyGuardsMintSettings = {
  [name: string]: Option<object>;
};
