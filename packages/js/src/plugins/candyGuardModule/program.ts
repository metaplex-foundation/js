import { PROGRAM_ID } from '@metaplex-foundation/mpl-candy-guard';

/** @group Programs */
export const DefaultCandyGuardProgram = {
  publicKey: PROGRAM_ID,
  availableGuards: [
    'bot_tax',
    'live_date',
    'lamports',
    'spl_token',
    'third_party_signer',
    'whitelist',
    'gatekeeper',
    'end_settings',
    'allow_list',
  ],
};
