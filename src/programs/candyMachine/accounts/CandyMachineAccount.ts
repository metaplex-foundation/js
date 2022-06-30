import { CandyMachine } from '@metaplex-foundation/mpl-candy-machine';
import {
  Account,
  getAccountParsingAndAssertingFunction,
  getAccountParsingFunction,
} from '@/types';

export type CandyMachineAccount = Account<CandyMachine>;
export const parseCandyMachineAccount = getAccountParsingFunction(CandyMachine);
export const toCandyMachineAccount =
  getAccountParsingAndAssertingFunction(CandyMachine);
