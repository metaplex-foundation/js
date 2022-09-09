import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, PublicKey } from '@/types';
import { DisposableScope } from '@/utils';
import { Commitment } from '@solana/web3.js';
import { CandyGuardsSettings, DefaultCandyGuardSettings } from '../guards';
import { CandyMachine } from '../models';

// -----------------
// Operation
// -----------------

const Key = 'FindCandyMachineByAddressOperation' as const;

/**
 * TODO
 *
 * ```ts
 * const { candyMachine } = await metaplex
 *   .candyMachines()
 *   .create({
 *   })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findCandyMachineByAddressOperation = <
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
>(
  input: FindCandyMachineByAddressInput
): FindCandyMachineByAddressOperation<T> => ({ key: Key, input });
findCandyMachineByAddressOperation.key = Key;

/**
 * @group Operations
 * @category Types
 */
export type FindCandyMachineByAddressOperation<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = Operation<
  typeof Key,
  FindCandyMachineByAddressInput,
  FindCandyMachineByAddressOutput<T>
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindCandyMachineByAddressInput = {
  /** The Candy Machine address. */
  address: PublicKey;

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Outputs
 */
export type FindCandyMachineByAddressOutput<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = CandyMachine<T>;

/**
 * @group Operations
 * @category Handlers
 */
export const findCandyMachineByAddressOperationHandler: OperationHandler<FindCandyMachineByAddressOperation> =
  {
    async handle(
      operation: FindCandyMachineByAddressOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<FindCandyMachineByAddressOutput<T>> {
      //
    },
  };
