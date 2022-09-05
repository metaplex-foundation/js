import type { Metaplex } from '@/Metaplex';
import { toPublicKey } from '@/types';
import { Task } from '@/utils';
import type { PublicKey } from '@solana/web3.js';
import { CandyGuardBuildersClient } from './CandyGuardBuildersClient';
import { UnregisteredCandyGuardError } from './errors';
import { CandyGuardManifest } from './guards';
import { CandyGuard } from './models';
import {
  CreateCandyGuardInput,
  createCandyGuardOperation,
  DeleteCandyGuardInput,
  deleteCandyGuardOperation,
  FindCandyGuardByAddressInput,
  findCandyGuardByAddressOperation,
  FindCandyGuardsByPublicKeyFieldInput,
  findCandyGuardsByPublicKeyFieldOperation,
  FindMintedNftsByCandyGuardInput,
  findMintedNftsByCandyGuardOperation,
  InsertItemsToCandyGuardInput,
  insertItemsToCandyGuardOperation,
  MintCandyGuardInput,
  mintCandyGuardOperation,
  UpdateCandyGuardInput,
  updateCandyGuardOperation,
} from './operations';
import { CandyGuardProgram } from './program';

/**
 * This is a client for the Candy Guard module.
 *
 * It enables us to interact with the Candy Guard program in order to
 * create, update and delete Candy Guards as well as mint from them.
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
 *     sellerFeeBasisPoints: 500, // 5% royalties
 *     price: sol(1.3), // 1.3 SOL
 *     itemsAvailable: toBigNumber(1000), // 1000 items available
 *   })
 *   .run();
 * ```
 *
 * @see {@link CandyGuard} The `CandyGuard` model
 * @group Modules
 */
export class CandyGuardClient {
  private guards: CandyGuardManifest[] = [];

  constructor(readonly metaplex: Metaplex) {}

  /** TODO */
  register(...guard: CandyGuardManifest[]) {
    this.guards.push(...guard);
  }

  /** TODO */
  getGuard(name: string): CandyGuardManifest {
    const guard = this.guards.find((guard) => guard.name === name);

    if (!guard) {
      throw new UnregisteredCandyGuardError(name);
    }

    return guard;
  }

  /** TODO */
  getAllGuards(): CandyGuardManifest[] {
    return this.guards;
  }

  /** TODO */
  getAllGuardsForProgram(
    nameOrAddress: string | PublicKey = 'CandyGuardProgram'
  ): CandyGuardManifest[] {
    const candyGuardProgram = this.metaplex
      .programs()
      .get<CandyGuardProgram>(nameOrAddress);

    return candyGuardProgram.availableGuards.map((name) => this.getGuard(name));
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

  /** {@inheritDoc deleteCandyGuardOperation} */
  delete(input: DeleteCandyGuardInput) {
    return this.metaplex.operations().getTask(deleteCandyGuardOperation(input));
  }

  /** {@inheritDoc findCandyGuardsByPublicKeyFieldOperation} */
  findAllBy(input: FindCandyGuardsByPublicKeyFieldInput) {
    return this.metaplex
      .operations()
      .getTask(findCandyGuardsByPublicKeyFieldOperation(input));
  }

  /** {@inheritDoc findCandyGuardByAddressOperation} */
  findByAddress(input: FindCandyGuardByAddressInput): Task<CandyGuard> {
    return this.metaplex
      .operations()
      .getTask(findCandyGuardByAddressOperation(input));
  }

  /** {@inheritDoc findMintedNftsByCandyGuardOperation} */
  findMintedNfts(input: FindMintedNftsByCandyGuardInput) {
    return this.metaplex
      .operations()
      .getTask(findMintedNftsByCandyGuardOperation(input));
  }

  /** {@inheritDoc insertItemsToCandyGuardOperation} */
  insertItems(input: InsertItemsToCandyGuardInput) {
    return this.metaplex
      .operations()
      .getTask(insertItemsToCandyGuardOperation(input));
  }

  /** {@inheritDoc mintCandyGuardOperation} */
  mint(input: MintCandyGuardInput) {
    return this.metaplex.operations().getTask(mintCandyGuardOperation(input));
  }

  /**
   * Helper method that refetches a given Candy Guard.
   *
   * ```ts
   * const candyGuard = await metaplex.candyGuards().refresh(candyGuard).run();
   * ```
   */
  refresh(
    candyGuard: CandyGuard | PublicKey,
    input?: Omit<FindCandyGuardByAddressInput, 'address'>
  ): Task<CandyGuard> {
    return this.findByAddress({ address: toPublicKey(candyGuard), ...input });
  }

  /** {@inheritDoc updateCandyGuardOperation} */
  update(input: UpdateCandyGuardInput) {
    return this.metaplex.operations().getTask(updateCandyGuardOperation(input));
  }
}
