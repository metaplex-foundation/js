import { PublicKey } from '@solana/web3.js';
import { Operation, OperationHandler, useOperation } from '@/types';
import { CandyMachine, makeCandyMachineModel } from './CandyMachine';
import { Metaplex } from '@/Metaplex';
import { parseCandyMachineAccount } from './accounts';

// -----------------
// Operation
// -----------------

const Key = 'FindCandyMachineByAdddressOperation' as const;
export const findCandyMachineByAdddressOperation =
  useOperation<FindCandyMachineByAdddressOperation>(Key);
export type FindCandyMachineByAdddressOperation = Operation<
  typeof Key,
  PublicKey,
  CandyMachine | null
>;

// -----------------
// Handler
// -----------------

export const findCandyMachineByAdddressOperationHandler: OperationHandler<FindCandyMachineByAdddressOperation> =
  {
    handle: async (
      operation: FindCandyMachineByAdddressOperation,
      metaplex: Metaplex
    ) => {
      const candyMachineAddress = operation.input;
      const unparsedAccount = await metaplex
        .rpc()
        .getAccount(candyMachineAddress);

      const account = parseCandyMachineAccount(unparsedAccount);

      return account.exists && unparsedAccount.exists
        ? makeCandyMachineModel(account, unparsedAccount)
        : null;
    },
  };
