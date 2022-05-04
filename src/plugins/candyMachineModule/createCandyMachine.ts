import { CandyMachineData } from '@metaplex-foundation/mpl-candy-machine';
import { ConfirmOptions, PublicKey, RpcResponseAndContext, SignatureResult } from '@solana/web3.js';
import { Signer } from '../../../shared';
import { Operation, useOperation } from '../../../drivers';

export type InitCandyMachineInput = {
  // Accounts
  payerSigner: Signer;
  // solTreasuryAccount
  walletAddress: PublicKey;
  candyMachineSigner: Signer;
  authorityAddress: PublicKey;
  // Accounts
  candyMachineData: CandyMachineData;
  // Transaction Options
  confirmOptions?: ConfirmOptions;
};

export type InitCandyMachineOutput = {
  // Accounts
  payerSigner: Signer;
  walletAddress: PublicKey;
  candyMachineSigner: Signer;
  authorityAddress: PublicKey;
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
