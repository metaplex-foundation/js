import { Metaplex, Program } from '@/index';
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
  mintSettingsParser?: (input: {
    metaplex: Metaplex;
    settings: Settings;
    mintSettings: Option<MintSettings>;
    payer: Signer;
    candyMachine: PublicKey;
    candyGuard: PublicKey;
    programs: Program[];
  }) => {
    arguments: Buffer;
    remainingAccounts: CandyGuardsMintRemainingAccount[];
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

/** TODO */
export type CandyGuardsMintRemainingAccount =
  | {
      isSigner: false;
      address: PublicKey;
      isWritable: boolean;
    }
  | {
      isSigner: true;
      address: Signer;
      isWritable: boolean;
    };
