import { Program } from '@/types';
import { PROGRAM_ID } from '@metaplex-foundation/mpl-candy-guard';

export type CandyGuardProgram = Program & { availableGuards: string[] };

/** @group Programs */
export const DefaultCandyGuardProgram: CandyGuardProgram = {
  name: 'CandyGuardProgram',
  address: PROGRAM_ID,
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
