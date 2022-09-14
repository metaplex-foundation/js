import { ErrorWithLogs, Program } from '@/types';
import { assert } from '@/utils';
import {
  cusper as defaultCandyGuardCusper,
  PROGRAM_ID as DEFAULT_CANDY_GUARD_PROGRAM_ID,
} from '@metaplex-foundation/mpl-candy-guard';
import {
  cusper as candyMachineCusper,
  PROGRAM_ID as CANDY_MACHINE_PROGRAM_ID,
} from '@metaplex-foundation/mpl-candy-machine-core';
import { defaultCandyGuardNames } from './guards';

/** @group Programs */
export const CandyMachineProgram: Program = {
  name: 'CandyMachineProgram',
  address: CANDY_MACHINE_PROGRAM_ID,
  errorResolver: (error: ErrorWithLogs) =>
    candyMachineCusper.errorFromProgramLogs(error.logs, false),
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
    defaultCandyGuardCusper.errorFromProgramLogs(error.logs, false),
  availableGuards: defaultCandyGuardNames,
};
