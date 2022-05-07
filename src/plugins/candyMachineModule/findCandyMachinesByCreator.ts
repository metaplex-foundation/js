import { PublicKey } from '@solana/web3.js';
import { Operation, OperationHandler, useOperation } from '@/types';
import { Metaplex } from '@/Metaplex';
import { CandyMachine } from './CandyMachine';
import { CandyMachineAccount, CandyMachineProgram } from '../../programs';

const Key = 'FindCandyMachinesByWalletOperation' as const;
export const findCandyMachinesByWalletOperation =
  useOperation<FindCandyMachinesByWalletOperation>(Key);
export type FindCandyMachinesByWalletOperation = Operation<
  typeof Key,
  FindCandyMachinesByWalletInput,
  CandyMachine[]
>;

export interface FindCandyMachinesByWalletInput {
  wallet: PublicKey;
  position?: number;
}

export const findCandyMachinesByWalletOnChainOperationHandler: OperationHandler<FindCandyMachinesByWalletOperation> =
  {
    handle: async (
      operation: FindCandyMachinesByWalletOperation,
      metaplex: Metaplex
    ): Promise<CandyMachine[]> => {
      const { wallet, position = 1 } = operation.input;

      const candyMachines = (
        await CandyMachineProgram.accounts(metaplex).candyMachineAccountsForWallet(wallet).get()
      ).map(CandyMachineAccount.from);

      return candyMachines;
    },
  };
