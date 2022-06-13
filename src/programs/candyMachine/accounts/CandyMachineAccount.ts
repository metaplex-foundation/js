import { CandyMachine } from '@metaplex-foundation/mpl-candy-machine';
import { Account, getAccountParsingFunction } from '@/types';

export type CandyMachineAccount = Account<CandyMachine>;

export const parseCandyMachineAccount = getAccountParsingFunction(CandyMachine);
