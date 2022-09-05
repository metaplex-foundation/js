import { ErrorWithLogs, Program } from '@/types';
import {
  PROGRAM_ID,
  errorFromCode,
} from '@metaplex-foundation/mpl-candy-guard';
import { initCusper } from '@metaplex-foundation/cusper';

export type CandyGuardProgram = Program & { availableGuards: string[] };

/** @group Programs */
export const DefaultCandyGuardProgram: CandyGuardProgram = {
  name: 'CandyGuardProgram',
  address: PROGRAM_ID,
  errorResolver: (error: ErrorWithLogs) =>
    initCusper(errorFromCode).errorFromProgramLogs(error.logs, false),
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
