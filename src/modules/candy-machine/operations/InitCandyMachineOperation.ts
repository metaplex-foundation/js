import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import { Operation } from '../../../shared';
import { CandyMachine } from '../models/CandyMachine';

export type InitCandyMachineInput = {
  // Accounts
  // payer: Keypair;
  // solTreasuryAccount
  wallet: PublicKey;
  candyMachine?: PublicKey;
  authority?: PublicKey;
  // Models
  candyMachineModel: CandyMachine;
  // Transactino Options
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
