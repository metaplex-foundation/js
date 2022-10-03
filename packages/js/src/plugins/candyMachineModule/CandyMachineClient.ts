import type { Metaplex } from '@/Metaplex';
import { toPublicKey } from '@/types';
import { Task } from '@/utils';
import type { Commitment } from '@solana/web3.js';
import { CandyMachineBuildersClient } from './CandyMachineBuildersClient';
import { CandyMachineGuardsClient } from './CandyMachineGuardsClient';
import { CandyMachinePdasClient } from './CandyMachinePdasClient';
import {
  CandyGuardsMintSettings,
  CandyGuardsSettings,
  DefaultCandyGuardMintSettings,
  DefaultCandyGuardSettings,
} from './guards';
import { CandyGuard, CandyMachine, isCandyMachine } from './models';
import {
  CreateCandyGuardInput,
  createCandyGuardOperation,
  CreateCandyMachineInput,
  createCandyMachineOperation,
  DeleteCandyGuardInput,
  deleteCandyGuardOperation,
  DeleteCandyMachineInput,
  deleteCandyMachineOperation,
  FindCandyGuardByAddressInput,
  findCandyGuardByAddressOperation,
  FindCandyGuardsByAuthorityInput,
  findCandyGuardsByAuthorityOperation,
  FindCandyMachineByAddressInput,
  findCandyMachineByAddressOperation,
  InsertCandyMachineItemsInput,
  insertCandyMachineItemsOperation,
  MintFromCandyMachineInput,
  mintFromCandyMachineOperation,
  UnwrapCandyGuardInput,
  unwrapCandyGuardOperation,
  UpdateCandyGuardInput,
  updateCandyGuardOperation,
  UpdateCandyMachineInput,
  updateCandyMachineOperation,
  WrapCandyGuardInput,
  wrapCandyGuardOperation,
} from './operations';

/**
 * This is a client for the Candy Machine V3 module.
 *
 * It enables us to interact with the Candy Machine V3 and Candy Guard programs
 * in order to create, update, delete and mint from Candy Machines as well as
 * registering your own custom Candy Guards.
 *
 * You may access this client via the `candyMachines()` method of your `Metaplex` instance.
 *
 * ```ts
 * const candyMachineClient = metaplex.candyMachines();
 * ```
 *
 * @example
 * You can create a new Candy Machine with minimum input like so.
 * By default, the current identity of the Metaplex instance will be
 * the authority of the Candy Machine and it will immediately create
 * a Candy Guard linked to the new Candy Machine.
 *
 * ```ts
 *  const { candyMachine } = await metaplex
 *    .candyMachines()
 *    .create({
 *      itemsAvailable: toBigNumber(5000),
 *      sellerFeeBasisPoints: 333, // 3.33%
 *      collection: {
 *        address: collectionNft.address,
 *        updateAuthority: collectionUpdateAuthority,
 *      },
 *    })
 *    .run();
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

  /**
   * You may use the `pdas()` client to build PDAs related to this module.
   *
   * ```ts
   * const pdasClient = metaplex.candyMachines().pdas();
   * ```
   */
  pdas() {
    return new CandyMachinePdasClient(this.metaplex);
  }

  /** {@inheritDoc createCandyMachineOperation} */
  create<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
    input: CreateCandyMachineInput<
      T extends undefined ? DefaultCandyGuardSettings : T
    >
  ) {
    return this.metaplex
      .operations()
      .getTask(createCandyMachineOperation(input));
  }

  /** {@inheritDoc createCandyGuardOperation} */
  createCandyGuard<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
    input: CreateCandyGuardInput<
      T extends undefined ? DefaultCandyGuardSettings : T
    >
  ) {
    return this.metaplex.operations().getTask(createCandyGuardOperation(input));
  }

  /** {@inheritDoc deleteCandyMachineOperation} */
  delete(input: DeleteCandyMachineInput) {
    return this.metaplex
      .operations()
      .getTask(deleteCandyMachineOperation(input));
  }

  /** {@inheritDoc deleteCandyGuardOperation} */
  deleteCandyGuard(input: DeleteCandyGuardInput) {
    return this.metaplex.operations().getTask(deleteCandyGuardOperation(input));
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
   * const candyGuard = await metaplex
   *   .candyMachines()
   *   .findCandyGuardByBaseAddress({ address: base })
   *   .run();
   * ```
   */
  findCandyGuardByBaseAddress<
    T extends CandyGuardsSettings = DefaultCandyGuardSettings
  >(input: FindCandyGuardByAddressInput) {
    const address = this.pdas().candyGuard({ base: input.address });
    return this.findCandyGuardByAddress<T>({ ...input, address });
  }

  /** {@inheritDoc insertCandyMachineItemsOperation} */
  insertItems(input: InsertCandyMachineItemsInput) {
    return this.metaplex
      .operations()
      .getTask(insertCandyMachineItemsOperation(input));
  }

  /** {@inheritDoc mintFromCandyMachineOperation} */
  mint<
    Settings extends CandyGuardsSettings = DefaultCandyGuardSettings,
    MintSettings extends CandyGuardsMintSettings = DefaultCandyGuardMintSettings
  >(
    input: MintFromCandyMachineInput<
      Settings extends undefined ? DefaultCandyGuardSettings : Settings,
      MintSettings extends undefined
        ? DefaultCandyGuardMintSettings
        : MintSettings
    >
  ) {
    return this.metaplex
      .operations()
      .getTask(mintFromCandyMachineOperation(input));
  }

  /**
   * Helper method that refetches a given Candy Machine or Candy Guard.
   *
   * ```ts
   * const candyMachine = await metaplex.candyMachines().refresh(candyMachine).run();
   * const candyGuard = await metaplex.candyMachines().refresh(candyGuard).run();
   * ```
   */
  refresh<
    T extends CandyGuardsSettings,
    M extends CandyMachine<T> | CandyGuard<T>
  >(model: M, commitment?: Commitment): Task<M> {
    const input = { address: toPublicKey(model), commitment };
    const task = isCandyMachine(model)
      ? this.findByAddress<T>(input)
      : this.findCandyGuardByAddress<T>(input);

    return task as Task<M>;
  }

  /** {@inheritDoc unwrapCandyGuardOperation} */
  unwrapCandyGuard(input: UnwrapCandyGuardInput) {
    return this.metaplex.operations().getTask(unwrapCandyGuardOperation(input));
  }

  /** {@inheritDoc updateCandyMachineOperation} */
  update<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
    input: UpdateCandyMachineInput<
      T extends undefined ? DefaultCandyGuardSettings : T
    >
  ) {
    return this.metaplex
      .operations()
      .getTask(updateCandyMachineOperation(input));
  }

  /** {@inheritDoc updateCandyGuardOperation} */
  updateCandyGuard<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
    input: UpdateCandyGuardInput<
      T extends undefined ? DefaultCandyGuardSettings : T
    >
  ) {
    return this.metaplex.operations().getTask(updateCandyGuardOperation(input));
  }

  /** {@inheritDoc wrapCandyGuardOperation} */
  wrapCandyGuard(input: WrapCandyGuardInput) {
    return this.metaplex.operations().getTask(wrapCandyGuardOperation(input));
  }
}
