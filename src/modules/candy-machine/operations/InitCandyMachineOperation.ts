import { ConfirmOptions, PublicKey, RpcResponseAndContext, SignatureResult } from '@solana/web3.js';
import { Operation, Signer } from '../../../shared';
import { CandyMachineModel } from '../models/CandyMachine';

export type InitCandyMachineInput = {
  // Accounts
  payer?: Signer;
  // solTreasuryAccount
  wallet: PublicKey;
  candyMachine?: Signer;
  authority?: PublicKey;
  // Models
  candyMachineModel: CandyMachineModel;
  // Transaction Options
  confirmOptions?: ConfirmOptions;
};

export type InitCandyMachineOutput = {
  // Accounts
  payer: Signer;
  wallet: PublicKey;
  candyMachine: Signer;
  authority: PublicKey;
  // Transaction Result
  transactionId: string;
  confirmed: RpcResponseAndContext<SignatureResult>;
};

export class InitCandyMachineOperation extends Operation<
  InitCandyMachineInput,
  InitCandyMachineOutput
> {}
