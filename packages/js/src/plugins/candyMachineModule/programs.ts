import { ErrorWithLogs, Program } from '@/types';
import { assert } from '@/utils';
import { initCusper } from '@metaplex-foundation/cusper';
import {
  errorFromCode as defaultCandyGuardErrorFromCode,
  PROGRAM_ID as DEFAULT_CANDY_GUARD_PROGRAM_ID,
} from '@metaplex-foundation/mpl-candy-guard';
import {
  errorFromCode as candyMachineErrorFromCode,
  PROGRAM_ID as CANDY_MACHINE_PROGRAM_ID,
} from '@metaplex-foundation/mpl-candy-machine-core';
import { defaultCandyGuardNames } from './guards';

/** @group Programs */
export const CandyMachineProgram: Program = {
  name: 'CandyMachineProgram',
  address: CANDY_MACHINE_PROGRAM_ID,
  errorResolver: (error: ErrorWithLogs) =>
    initCusper(candyMachineErrorFromCode).errorFromProgramLogs(
      error.logs,
      false
    ),
};

/** @group Programs */
export type CandyGuardProgram = Program & { availableGuards: string[] };

export const isCandyGuardProgram = (
  value: Program
): value is CandyGuardProgram =>
  typeof value === 'object' && 'availableGuards' in value;

export function assertCandyGuardProgram(
  value: Program
): asserts value is CandyGuardProgram {
  assert(isCandyGuardProgram(value), `Expected CandyGuardProgram model`);
}

/** @group Programs */
export const DefaultCandyGuardProgram: CandyGuardProgram = {
  name: 'CandyGuardProgram',
  address: DEFAULT_CANDY_GUARD_PROGRAM_ID,
  errorResolver: (error: ErrorWithLogs) =>
    initCusper(defaultCandyGuardErrorFromCode).errorFromProgramLogs(
      error.logs,
      false
    ),
  availableGuards: defaultCandyGuardNames,
};
