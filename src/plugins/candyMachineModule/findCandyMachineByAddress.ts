import { PublicKey } from '@solana/web3.js';
import { Operation, OperationHandler, useOperation } from '@/types';
import { CandyMachine } from './CandyMachine';
import { Metaplex } from '@/Metaplex';
import { parseCandyMachineAccount } from '@/programs';

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

      return unparsedAccount.exists && account.exists
        ? CandyMachine.fromAccount(account, unparsedAccount.data)
        : null;
    },
  };
