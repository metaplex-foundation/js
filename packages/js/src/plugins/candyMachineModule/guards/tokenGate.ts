import {
  createSerializerFromBeet,
  mapSerializer,
  PublicKey,
  SplTokenAmount,
  token,
} from '@/types';
import { TokenGate, tokenGateBeet } from '@metaplex-foundation/mpl-candy-guard';
import { GuardMitingSettingsMissingError } from '../errors';
import { CandyGuardManifest } from './core';

/** TODO */
export type TokenGateGuardSettings = {
  mint: PublicKey;
  amount: SplTokenAmount;
};

/** TODO */
export type TokenGateGuardMintSettings = {
  tokenAccount: PublicKey;
};

/** @internal */
export const tokenGateGuardManifest: CandyGuardManifest<
  TokenGateGuardSettings,
  TokenGateGuardMintSettings
> = {
  name: 'tokenGate',
  settingsBytes: 40,
  settingsSerializer: mapSerializer<TokenGate, TokenGateGuardSettings>(
    createSerializerFromBeet(tokenGateBeet),
    (settings) => ({ ...settings, amount: token(settings.amount) }),
    (settings) => ({ ...settings, amount: settings.amount.basisPoints })
  ),
  mintSettingsParser: ({ mintSettings }) => {
    if (!mintSettings) {
      throw new GuardMitingSettingsMissingError('tokenGate');
    }

    return {
      arguments: Buffer.from([]),
      remainingAccounts: [
        {
          isSigner: false,
          address: mintSettings.tokenAccount,
          isWritable: false,
        },
      ],
    };
  },
};
