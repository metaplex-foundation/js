import { Metaplex } from '@/Metaplex';
import {
  assertAccountExists,
  Operation,
  OperationHandler,
  useOperation,
} from '@/types';
import { Commitment, PublicKey } from '@solana/web3.js';
import { CandyGuardsSettings, DefaultCandyGuardSettings } from '../guards';
import { CandyGuard, toCandyGuard } from '../models';

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
export const findCandyGuardByAddressOperation = <
  GuardSettings extends CandyGuardsSettings = DefaultCandyGuardSettings
>() => useOperation<FindCandyGuardByAddressOperation<GuardSettings>>(Key);

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
      const account = await metaplex.rpc().getAccount(address, commitment);
      assertAccountExists(account);

      return toCandyGuard(account, metaplex);
    },
  };
