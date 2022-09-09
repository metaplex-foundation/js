import type { Metaplex } from '@/Metaplex';
import { toPublicKey } from '@/types';
import { Task } from '@/utils';
import type { PublicKey } from '@solana/web3.js';
import { CandyMachineBuildersClient } from './CandyMachineBuildersClient';
import { CandyMachineGuardsClient } from './CandyMachineGuardsClient';
import { CandyGuardsSettings, DefaultCandyGuardSettings } from './guards';
import { CandyGuard } from './models';
import {
  CreateCandyGuardInput,
  createCandyGuardOperation,
  CreateCandyMachineInput,
  createCandyMachineOperation,
  FindCandyGuardByAddressInput,
  findCandyGuardByAddressOperation,
  FindCandyGuardsByAuthorityInput,
  findCandyGuardsByAuthorityOperation,
  FindCandyMachineByAddressInput,
  findCandyMachineByAddressOperation,
  UpdateCandyGuardInput,
  updateCandyGuardOperation,
} from './operations';
import { findCandyGuardPda } from './pdas';

/**
 * This is a client for the Candy Machine V3 module.
 *
 * It enables us to interact with the Candy Machine V3 and Candy Guard programs
 * in order to create, update, delete and mint from Candy Machines as well as
 * registering your own custom Candy Guards.
 *
 * You may access this client via the `candyGuards()` method of your `Metaplex` instance.
 *
 * ```ts
 * const candyMachineClient = metaplex.candyMachines();
 * ```
 *
 * @example
 * TODO: Update example with create candy machine when implemented.
 *
 * You can create a new Candy Guard with minimum input like so.
 * By default, the current identity of the Metaplex instance will be
 * the authority of the Candy Guard.
 *
 * ```ts
 * const { candyGuard } = await metaplex
 *   .candyMachines()
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
export class CandyMachineClient {
  private readonly guardsClient: CandyMachineGuardsClient;

  constructor(readonly metaplex: Metaplex) {
    this.guardsClient = new CandyMachineGuardsClient(metaplex);
  }

  /**
   * You may use the `guards()` client to access the default guards
   * available as well as register your own guards.
   *
   * ```ts
   * const guardsClient = metaplex.candyMachines().guards();
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
   * const buildersClient = metaplex.candyMachines().builders();
   * ```
   */
  builders() {
    return new CandyMachineBuildersClient(this.metaplex);
  }

  /** {@inheritDoc createCandyMachineOperation} */
  create<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
    input: CreateCandyMachineInput<T>
  ) {
    return this.metaplex
      .operations()
      .getTask(createCandyMachineOperation<T>(input));
  }

  /** {@inheritDoc createCandyGuardOperation} */
  createCandyGuard<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
    input: CreateCandyGuardInput<T>
  ) {
    return this.metaplex
      .operations()
      .getTask(createCandyGuardOperation<T>(input));
  }

  /** {@inheritDoc findCandyGuardsByAuthorityOperation} */
  findAllCandyGuardsByAuthority<
    T extends CandyGuardsSettings = DefaultCandyGuardSettings
  >(input: FindCandyGuardsByAuthorityInput) {
    return this.metaplex
      .operations()
      .getTask(findCandyGuardsByAuthorityOperation<T>(input));
  }

  /** {@inheritDoc findCandyMachineByAddressOperation} */
  findByAddress<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
    input: FindCandyMachineByAddressInput
  ) {
    return this.metaplex
      .operations()
      .getTask(findCandyMachineByAddressOperation<T>(input));
  }

  /** {@inheritDoc findCandyGuardByAddressOperation} */
  findCandyGuardByAddress<
    T extends CandyGuardsSettings = DefaultCandyGuardSettings
  >(input: FindCandyGuardByAddressInput) {
    return this.metaplex
      .operations()
      .getTask(findCandyGuardByAddressOperation<T>(input));
  }

  /**
   * Helper method that fetches a Candy Guard via the base
   * address used to derived its PDA.
   *
   * ```ts
   * const candyGuard = await metaplex.candyMachines().findCandyGuardByBaseAddress(base).run();
   * ```
   */
  findCandyGuardByBaseAddress<
    T extends CandyGuardsSettings = DefaultCandyGuardSettings
  >(input: FindCandyGuardByAddressInput) {
    return this.findCandyGuardByAddress<T>({
      ...input,
      address: findCandyGuardPda(input.address),
    });
  }

  /**
   * Helper method that refetches a given Candy Machine or Candy Guard.
   *
   * ```ts
   * const candyMachine = await metaplex.candyMachines().refresh(candyMachine).run();
   * const candyGuard = await metaplex.candyMachines().refresh(candyGuard).run();
   * ```
   */
  refresh<T extends CandyGuardsSettings>(
    model: CandyGuard<T> | PublicKey,
    input?: Omit<FindCandyGuardByAddressInput, 'address'>
  ): Task<CandyGuard<T>> {
    // TODO: support CM too.
    return this.findCandyGuardByAddress<T>({
      address: toPublicKey(model),
      ...input,
    });
  }

  /** {@inheritDoc updateCandyGuardOperation} */
  updateCandyGuard<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
    input: UpdateCandyGuardInput<T>
  ) {
    return this.metaplex
      .operations()
      .getTask(updateCandyGuardOperation<T>(input));
  }
}
