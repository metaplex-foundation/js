import {
  createSerializerFromBeet,
  lamports,
  mapSerializer,
  PublicKey,
  SolAmount,
} from '@/types';
import { Option } from '@/utils';
import { Beet } from '@metaplex-foundation/beet';
import {
  Whitelist,
  whitelistBeet,
  WhitelistTokenMode,
} from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type WhitelistGuardSettings = {
  mint: PublicKey;
  presale: boolean;
  discountPrice: Option<SolAmount>;
  mode: WhitelistTokenMode;
};

/** @internal */
export const whitelistGuardManifest: CandyGuardManifest<WhitelistGuardSettings> =
  {
    name: 'whitelist',
    settingsBytes: 43,
    settingsSerializer: mapSerializer<Whitelist, WhitelistGuardSettings>(
      createSerializerFromBeet(whitelistBeet as Beet<Whitelist>),
      (settings) => ({
        ...settings,
        discountPrice: settings.discountPrice
          ? lamports(settings.discountPrice)
          : null,
      }),
      (settings) => ({
        ...settings,
        discountPrice: settings.discountPrice?.basisPoints ?? null,
      })
    ),
  };
