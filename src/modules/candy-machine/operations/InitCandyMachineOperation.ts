import { ConfirmOptions, PublicKey, RpcResponseAndContext, SignatureResult } from '@solana/web3.js';
import { Operation, Signer, useOperation } from '../../../shared';
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
  confirmResponse: RpcResponseAndContext<SignatureResult>;
};

const K = 'InitCandyMachineOperation' as const;
export type InitCandyMachineOperation = Operation<
  typeof K,
  InitCandyMachineInput,
  InitCandyMachineOutput
>;

export const initCandyMachineOperation = useOperation<InitCandyMachineOperation>(K);
