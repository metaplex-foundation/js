import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { Operation } from '../../../shared';
import { CandyMachine } from '../models/CandyMachine';

export type InitCandyMachineInput = {
  // Accounts
  payer: PublicKey;
  // solTreasuryAccount
  wallet: PublicKey;
  candyMachine?: PublicKey;
  authority?: PublicKey;
  // Models
  candyMachineModel: CandyMachine;
  // Transaction Options
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
