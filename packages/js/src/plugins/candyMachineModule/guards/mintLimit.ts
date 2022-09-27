import { createSerializerFromBeet } from '@/types';
import { MintLimit, mintLimitBeet } from '@metaplex-foundation/mpl-candy-guard';
import { Buffer } from 'buffer';
import { CandyGuardManifest } from './core';

/**
 * The settings for the mintLimit guard that should
 * be provided when creating and/or updating
 * a Candy Machine or a Candy Guard directly.
 */
export type MintLimitGuardSettings = MintLimit;

/** @internal */
export const mintLimitGuardManifest: CandyGuardManifest<MintLimitGuardSettings> =
  {
    name: 'mintLimit',
    settingsBytes: 3,
    settingsSerializer: createSerializerFromBeet(mintLimitBeet),
    mintSettingsParser: ({
      metaplex,
      settings,
      payer,
      candyMachine,
      candyGuard,
      programs,
    }) => {
      const counterPda = metaplex.candyMachines().pdas().mintLimitCounter({
        id: settings.id,
        user: payer.publicKey,
        candyMachine,
        candyGuard,
        programs,
      });

      return {
        arguments: Buffer.from([]),
        remainingAccounts: [
          {
            address: counterPda,
            isSigner: false,
            isWritable: true,
          },
        ],
      };
    },
  };
