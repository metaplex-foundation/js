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
import { CandyMachineV2, toCandyMachineV2 } from '../models';
import { findCandyMachineCollectionPda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'FindCandyMachineV2ByAddressOperation' as const;

/**
 * Find an existing Candy Machine by its address.
 *
 * ```ts
 * const candyMachine = await metaplex.candyMachinesV2().findbyAddress({ address }).run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findCandyMachineV2ByAddressOperation =
  useOperation<FindCandyMachineV2ByAddressOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindCandyMachineV2ByAddressOperation = Operation<
  typeof Key,
  FindCandyMachineV2ByAddressInput,
  CandyMachineV2
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindCandyMachineV2ByAddressInput = {
  /** The Candy Machine address. */
  address: PublicKey;

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Handlers
 */
export const findCandyMachineV2ByAddressOperationHandler: OperationHandler<FindCandyMachineV2ByAddressOperation> =
  {
    handle: async (
      operation: FindCandyMachineV2ByAddressOperation,
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

      return toCandyMachineV2(account, unparsedAccount, collectionAccount);
    },
  };
