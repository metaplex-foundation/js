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
 * Find an existing Candy Guard by its address.
 *
 * ```ts
 * const candyGuard = await metaplex
 *   .candyMachines()
 *   .findCandyGuardbyAddress({ address })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findCandyGuardByAddressOperation = <
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
>() => useOperation<FindCandyGuardByAddressOperation<T>>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindCandyGuardByAddressOperation<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = Operation<typeof Key, FindCandyGuardByAddressInput, CandyGuard<T>>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindCandyGuardByAddressInput = {
  /** The Candy Guard address. */
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
    handle: async <T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
      operation: FindCandyGuardByAddressOperation,
      metaplex: Metaplex
    ): Promise<CandyGuard<T>> => {
      const { address, commitment } = operation.input;
      const account = await metaplex.rpc().getAccount(address, commitment);
      assertAccountExists(account);

      return toCandyGuard<T>(account, metaplex);
    },
  };
