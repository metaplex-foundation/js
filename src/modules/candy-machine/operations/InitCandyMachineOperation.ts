import { ConfirmOptions } from '@solana/web3.js';
import { Operation } from '../../../shared';
import { CandyMachine } from '../models/CandyMachine';
import { CandyMachineConfig, StorageConfig } from '../models/config';

export type InitCandyMachineInput = Omit<CandyMachineConfig, keyof StorageConfig> & {
  confirmOptions?: ConfirmOptions;
};

export type InitCandyMachineOutput = {
  candyMachine: CandyMachine;
  transactionId: string;
};

export class InitCandyMachineOperation extends Operation<
  InitCandyMachineInput,
  InitCandyMachineOutput
> {}
