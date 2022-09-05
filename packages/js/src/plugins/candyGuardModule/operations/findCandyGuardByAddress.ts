import { Metaplex } from '@/Metaplex';
import {
  assertAccountExists,
  Operation,
  OperationHandler,
  useOperation,
} from '@/types';
import { Commitment, PublicKey } from '@solana/web3.js';
import { CandyGuardsSettings, DefaultCandyGuardSettings } from '../guards';
import { CandyGuard } from '../models';

// -----------------
// Operation
// -----------------

const Key = 'FindCandyGuardByAddressOperation' as const;

/**
 * Find an existing Candy Machine by its address.
 *
 * ```ts
 * const candyMachine = await metaplex.candyMachines().findbyAddress({ address }).run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findCandyGuardByAddressOperation =
  useOperation<FindCandyGuardByAddressOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindCandyGuardByAddressOperation<
  GuardSettings extends CandyGuardsSettings = DefaultCandyGuardSettings
> = Operation<
  typeof Key,
  FindCandyGuardByAddressInput,
  CandyGuard<GuardSettings>
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindCandyGuardByAddressInput = {
  /** The Candy Machine address. */
  address: PublicKey;

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Handlers
 */
export const findCandyGuardByAddressOperationHandler: OperationHandler<FindCandyGuardByAddressOperation> =
  {
    handle: async (
      operation: FindCandyGuardByAddressOperation,
      metaplex: Metaplex
    ) => {
      const { address, commitment } = operation.input;
      const collectionPda = findCandyGuardCollectionPda(address);
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
