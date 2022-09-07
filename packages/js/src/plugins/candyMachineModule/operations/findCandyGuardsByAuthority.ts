import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { GpaBuilder } from '@/utils';
import { CandyGuard as MplCandyGuard } from '@metaplex-foundation/mpl-candy-guard';
import { Commitment, PublicKey } from '@solana/web3.js';
import { CandyGuardsSettings, DefaultCandyGuardSettings } from '../guards';
import { CandyGuard, toCandyGuard } from '../models';

// -----------------
// Operation
// -----------------

const Key = 'FindCandyGuardsByAuthorityOperation' as const;

/**
 * Find all Candy Guards matching by a given authority.
 *
 * ```ts
 * const candyGuards = await metaplex
 *   .candyMachines()
 *   .findAllCandyGuardsByAuthority({ authority: new PublicKey('...') });
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findCandyGuardsByAuthorityOperation = <
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
>() => useOperation<FindCandyGuardsByAuthorityOperation<T>>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindCandyGuardsByAuthorityOperation<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = Operation<typeof Key, FindCandyGuardsByAuthorityInput, CandyGuard<T>[]>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindCandyGuardsByAuthorityInput = {
  /** The authority to filter Candy Guards by. */
  authority: PublicKey;

  /** The Candy Guard program to use when fetching accounts. */
  candyCoreProgram?: PublicKey;

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Handlers
 */
export const findCandyGuardsByAuthorityOperationHandler: OperationHandler<FindCandyGuardsByAuthorityOperation> =
  {
    handle: async <T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
      operation: FindCandyGuardsByAuthorityOperation<T>,
      metaplex: Metaplex
    ) => {
      const { authority, commitment } = operation.input;
      const candyGuardProgram = metaplex.programs().get('CandyGuardProgram');
      const query = MplCandyGuard.gpaBuilder(
        candyGuardProgram.address
      ).addFilter('authority', authority);

      const gpaBuilder = new GpaBuilder(metaplex, candyGuardProgram.address);
      gpaBuilder.mergeConfig({ ...query.config, commitment });

      return gpaBuilder.getAndMap((account) => toCandyGuard(account, metaplex));
    },
  };
