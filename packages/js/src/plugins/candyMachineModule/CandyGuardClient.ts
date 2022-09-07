import type { Metaplex } from '@/Metaplex';
import { toPublicKey } from '@/types';
import { Task } from '@/utils';
import type { PublicKey } from '@solana/web3.js';
import { CandyGuardBuildersClient } from './CandyGuardBuildersClient';
import { CandyGuardGuardsClient } from './CandyGuardGuardsClient';
import { CandyGuardsSettings, DefaultCandyGuardSettings } from './guards';
import { CandyGuard } from './models';
import {
  CreateCandyGuardInput,
  createCandyGuardOperation,
  FindCandyGuardByAddressInput,
  findCandyGuardByAddressOperation,
  FindCandyGuardsByAuthorityInput,
  findCandyGuardsByAuthorityOperation,
  UpdateCandyGuardInput,
  updateCandyGuardOperation,
} from './operations';
import { findCandyGuardPda } from './pdas';

/**
 * This is a client for the Candy Guard module.
 *
 * It enables us to interact with the Candy Guard program in order to
 * create and update Candy Guards as well as mint from them.
 *
 * You may access this client via the `candyGuards()` method of your `Metaplex` instance.
 *
 * ```ts
 * const candyGuardClient = metaplex.candyGuards();
 * ```
 *
 * @example
 * You can create a new Candy Guard with minimum input like so.
 * By default, the current identity of the Metaplex instance will be
 * the authority of the Candy Guard.
 *
 * ```ts
 * const { candyGuard } = await metaplex
 *   .candyGuards()
 *   .create({
 *     guards: {
 *       liveDate: { date: toDateTime('2022-09-05T20:00:00.000Z') },
 *       lamports: { amount: sol(1.5), },
 *       botTax: { lamports: sol(0.01), lastInstruction: true },
 *     },
 *   })
 *   .run();
 * ```
 *
 * @see {@link CandyGuard} The `CandyGuard` model
 * @group Modules
 */
export class CandyGuardClient {
  private readonly guardsClient: CandyGuardGuardsClient;

  constructor(readonly metaplex: Metaplex) {
    this.guardsClient = new CandyGuardGuardsClient(metaplex);
  }

  /**
   * You may use the `guards()` client to access the default guards
   * available as well as register your own guards.
   *
   * ```ts
   * const guardsClient = metaplex.candyGuards().guards();
   * ```
   */
  guards() {
    return this.guardsClient;
  }

  /**
   * You may use the `builders()` client to access the
   * underlying Transaction Builders of this module.
   *
   * ```ts
   * const buildersClient = metaplex.candyGuards().builders();
   * ```
   */
  builders() {
    return new CandyGuardBuildersClient(this.metaplex);
  }

  /** {@inheritDoc createCandyGuardOperation} */
  create(input: CreateCandyGuardInput) {
    return this.metaplex.operations().getTask(createCandyGuardOperation(input));
  }

  /** {@inheritDoc findCandyGuardsByAuthorityOperation} */
  findAllByAuthority<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
    input: FindCandyGuardsByAuthorityInput
  ) {
    return this.metaplex
      .operations()
      .getTask(findCandyGuardsByAuthorityOperation<T>()(input));
  }

  /** {@inheritDoc findCandyGuardByAddressOperation} */
  findByAddress<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
    input: FindCandyGuardByAddressInput
  ): Task<CandyGuard<T>> {
    return this.metaplex
      .operations()
      .getTask(findCandyGuardByAddressOperation<T>()(input));
  }

  /**
   * Helper method that fetches a Candy Guard via the base
   * address used to derived its PDA.
   *
   * ```ts
   * const candyGuard = await metaplex.candyGuards().findByBaseAddress(base).run();
   * ```
   */
  findByBaseAddress<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
    input: FindCandyGuardByAddressInput
  ): Task<CandyGuard<T>> {
    return this.findByAddress({
      ...input,
      address: findCandyGuardPda(input.address),
    });
  }

  /**
   * Helper method that refetches a given Candy Guard.
   *
   * ```ts
   * const candyGuard = await metaplex.candyGuards().refresh(candyGuard).run();
   * ```
   */
  refresh<T extends CandyGuardsSettings>(
    candyGuard: CandyGuard<T> | PublicKey,
    input?: Omit<FindCandyGuardByAddressInput, 'address'>
  ): Task<CandyGuard<T>> {
    return this.findByAddress<T>({
      address: toPublicKey(candyGuard),
      ...input,
    });
  }

  /** {@inheritDoc updateCandyGuardOperation} */
  update(input: UpdateCandyGuardInput) {
    return this.metaplex.operations().getTask(updateCandyGuardOperation(input));
  }
}
