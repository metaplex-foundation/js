import { PublicKey } from '@solana/web3.js';
import { Operation, OperationHandler, useOperation } from '@/types';
import { CandyMachine } from './CandyMachine';
import { Metaplex } from '@/Metaplex';
import { CandyMachineAccount } from '@/programs';

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

      const account = CandyMachineAccount.fromMaybe(unparsedAccount);

      return account.exists ? CandyMachine.fromAccount(account) : null;
    },
  };
