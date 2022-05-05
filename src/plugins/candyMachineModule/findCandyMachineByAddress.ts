import { PublicKey } from '@solana/web3.js';
import { Operation, OperationHandler, useOperation } from '@/types';
import { CandyMachine } from './CandyMachine';
import { Metaplex } from '@/Metaplex';
import { CandyMachineAccount } from '@/programs';

const Key = 'FindCandyMachineByAdddressOperation' as const;
export const findCandyMachineByAdddressOperation =
  useOperation<FindCandyMachineByAdddressOperation>(Key);
export type FindCandyMachineByAdddressOperation = Operation<typeof Key, PublicKey, CandyMachine>;

export const findCandyMachineByAdddressOperationHandler: OperationHandler<FindCandyMachineByAdddressOperation> =
  {
    handle: async (operation: FindCandyMachineByAdddressOperation, metaplex: Metaplex) => {
      const candyMachineAddress = operation.input;
      const account = await CandyMachineAccount.fromAccountAddress(
        metaplex.connection,
        candyMachineAddress
      );
      return CandyMachine.fromAccount(account);
    },
  };
