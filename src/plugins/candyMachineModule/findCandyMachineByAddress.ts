import { Commitment, PublicKey } from '@solana/web3.js';
import {
  assertAccountExists,
  Operation,
  OperationHandler,
  useOperation,
} from '@/types';
import { CandyMachine, toCandyMachine } from './CandyMachine';
import { Metaplex } from '@/Metaplex';
import {
  parseCandyMachineCollectionAccount,
  toCandyMachineAccount,
} from './accounts';
import { findCandyMachineCollectionPda } from './pdas';

// -----------------
// Operation
// -----------------

const Key = 'FindCandyMachineByAddressOperation' as const;
export const findCandyMachineByAddressOperation =
  useOperation<FindCandyMachineByAddressOperation>(Key);
export type FindCandyMachineByAddressOperation = Operation<
  typeof Key,
  FindCandyMachineByAddressInput,
  CandyMachine
>;

export type FindCandyMachineByAddressInput = {
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
      const collectionPda = findCandyMachineCollectionPda(address);
      const accounts = await metaplex
        .rpc()
        .getMultipleAccounts([address, collectionPda], commitment);

      const unparsedAccount = accounts[0];
      assertAccountExists(unparsedAccount);
      const account = toCandyMachineAccount(unparsedAccount);
      const collectionAccount = parseCandyMachineCollectionAccount(accounts[1]);

      return toCandyMachine(account, unparsedAccount, collectionAccount);
    },
  };
