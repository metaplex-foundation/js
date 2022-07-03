import { Commitment, PublicKey } from '@solana/web3.js';
import {
  assertAccountExists,
  Operation,
  OperationHandler,
  useOperation,
} from '@/types';
import { CandyMachine, toCandyMachine } from './CandyMachine';
import { Metaplex } from '@/Metaplex';
import { toCandyMachineAccount } from './accounts';

// -----------------
// Operation
// -----------------

const Key = 'FindCandyMachineByAddressOperation' as const;
export const findCandyMachineByAddressOperation =
  useOperation<FindCandyMachineByAddressOperation>(Key);
export type FindCandyMachineByAddressOperation = Operation<
  typeof Key,
  FindCandyMachineByAddressOperationInput,
  CandyMachine
>;

export type FindCandyMachineByAddressOperationInput = {
  address: PublicKey;
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

export const findCandyMachineByAddressOperationHandler: OperationHandler<FindCandyMachineByAddressOperation> =
  {
    handle: async (
      operation: FindCandyMachineByAddressOperation,
      metaplex: Metaplex
    ) => {
      const { address, commitment } = operation.input;
      const unparsedAccount = await metaplex
        .rpc()
        .getAccount(address, commitment);

      assertAccountExists(unparsedAccount);
      const account = toCandyMachineAccount(unparsedAccount);

      return toCandyMachine(account, unparsedAccount);
    },
  };
