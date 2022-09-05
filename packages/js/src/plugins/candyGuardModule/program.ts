import { ErrorWithLogs, Program } from '@/types';
import { initCusper } from '@metaplex-foundation/cusper';
import {
  errorFromCode,
  PROGRAM_ID,
} from '@metaplex-foundation/mpl-candy-guard';
import { defaultCandyGuardNames } from './guards';

export type CandyGuardProgram = Program & { availableGuards: string[] };

/** @group Programs */
export const DefaultCandyGuardProgram: CandyGuardProgram = {
  name: 'CandyGuardProgram',
  address: PROGRAM_ID,
  errorResolver: (error: ErrorWithLogs) =>
    initCusper(errorFromCode).errorFromProgramLogs(error.logs, false),
  availableGuards: defaultCandyGuardNames,
};
