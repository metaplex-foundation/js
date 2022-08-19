import type { Metaplex } from '@/Metaplex';
import { toPublicKey } from '@/types';
import { Task } from '@/utils';
import type { PublicKey } from '@solana/web3.js';
import { CandyMachinesBuildersClient } from './CandyMachinesBuildersClient';
import { CandyMachine } from './models';
import {
  CreateCandyMachineInput,
  createCandyMachineOperation,
  DeleteCandyMachineInput,
  deleteCandyMachineOperation,
  FindCandyMachineByAddressInput,
  findCandyMachineByAddressOperation,
  FindCandyMachinesByPublicKeyFieldInput,
  findCandyMachinesByPublicKeyFieldOperation,
  FindMintedNftsByCandyMachineInput,
  findMintedNftsByCandyMachineOperation,
  InsertItemsToCandyMachineInput,
  insertItemsToCandyMachineOperation,
  MintCandyMachineInput,
  mintCandyMachineOperation,
  UpdateCandyMachineInput,
  updateCandyMachineOperation,
} from './operations';

/**
 * This is a client for the Candy Machine module.
 *
 * It enables us to interact with the Candy Machine program in order to
 * create, update and delete Candy Machines as well as mint from them.
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
 * the authority of the Candy Machine.
 *
 * ```ts
 * const { candyMachine } = await metaplex
 *   .candyMachines()
 *   .create({
 *     sellerFeeBasisPoints: 500, // 5% royalties
 *     price: sol(1.3), // 1.3 SOL
 *     itemsAvailable: toBigNumber(1000), // 1000 items available
 *   })
 *   .run();
 * ```
 *
 * @see {@link CandyMachine} The `CandyMachine` model
 * @group Modules
 */
export class CandyMachinesClient {
  constructor(readonly metaplex: Metaplex) {}

  /**
   * You may use the `builders()` client to access the
   * underlying Transaction Builders of this module.
   *
   * ```ts
   * const buildersClient = metaplex.candyMachines().builders();
   * ```
   */
  builders() {
    return new CandyMachinesBuildersClient(this.metaplex);
  }

  /** {@inheritDoc createCandyMachineOperation} */
  create(input: CreateCandyMachineInput) {
    return this.metaplex
      .operations()
      .getTask(createCandyMachineOperation(input));
  }

  /** {@inheritDoc deleteCandyMachineOperation} */
  delete(input: DeleteCandyMachineInput) {
    return this.metaplex
      .operations()
      .getTask(deleteCandyMachineOperation(input));
  }

  /** {@inheritDoc findCandyMachinesByPublicKeyFieldOperation} */
  findAllBy(input: FindCandyMachinesByPublicKeyFieldInput) {
    return this.metaplex
      .operations()
      .getTask(findCandyMachinesByPublicKeyFieldOperation(input));
  }

  /** {@inheritDoc findCandyMachineByAddressOperation} */
  findByAddress(input: FindCandyMachineByAddressInput): Task<CandyMachine> {
    return this.metaplex
      .operations()
      .getTask(findCandyMachineByAddressOperation(input));
  }

  /** {@inheritDoc findMintedNftsByCandyMachineOperation} */
  findMintedNfts(input: FindMintedNftsByCandyMachineInput) {
    return this.metaplex
      .operations()
      .getTask(findMintedNftsByCandyMachineOperation(input));
  }

  /** {@inheritDoc insertItemsToCandyMachineOperation} */
  insertItems(input: InsertItemsToCandyMachineInput) {
    return this.metaplex
      .operations()
      .getTask(insertItemsToCandyMachineOperation(input));
  }

  /** {@inheritDoc mintCandyMachineOperation} */
  mint(input: MintCandyMachineInput) {
    return this.metaplex.operations().getTask(mintCandyMachineOperation(input));
  }

  /**
   * Helper method that refetches a given Candy Machine.
   *
   * ```ts
   * const candyMachine = await metaplex.candyMachines().refresh(candyMachine).run();
   * ```
   */
  refresh(
    candyMachine: CandyMachine | PublicKey,
    input?: Omit<FindCandyMachineByAddressInput, 'address'>
  ): Task<CandyMachine> {
    return this.findByAddress({ address: toPublicKey(candyMachine), ...input });
  }

  /** {@inheritDoc updateCandyMachineOperation} */
  update(input: UpdateCandyMachineInput) {
    return this.metaplex
      .operations()
      .getTask(updateCandyMachineOperation(input));
  }
}
