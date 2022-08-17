import { Metaplex } from '@/Metaplex';
import {
  assertAccountExists,
  Operation,
  OperationHandler,
  useOperation,
} from '@/types';
import { Commitment, PublicKey } from '@solana/web3.js';
import {
  parseCandyMachineCollectionAccount,
  toCandyMachineAccount,
} from '../accounts';
import { CandyMachine, toCandyMachine } from '../models/CandyMachine';
import { findCandyMachineCollectionPda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'FindCandyMachineByAddressOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const findCandyMachineByAddressOperation =
  useOperation<FindCandyMachineByAddressOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindCandyMachineByAddressOperation = Operation<
  typeof Key,
  FindCandyMachineByAddressInput,
  CandyMachine
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindCandyMachineByAddressInput = {
  address: PublicKey;
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Handlers
 */
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
