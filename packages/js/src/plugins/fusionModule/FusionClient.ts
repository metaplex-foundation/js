import { FusionBuildersClient } from './FusionBuildersClient';
import {
  CreateFusionParentInput,
  createFusionParentOperation,
} from './operations/createFusionParent';
import { FusionPdasClient } from './FusionPdasClient';
import type { Metaplex } from '@/Metaplex';
import { OperationOptions } from '@/types';

/**
 * This is a client for the Fusion module.
 *
 * It enables us to interact with the Fusion program in order to
 * create and update Fusion to configure a marketplace as well to allow
 * users to list, bid and execute sales.
 *
 * You may access this client via the `fusion()` method of your `Metaplex` instance.
 *
 * ```ts
 * const fusionClient = metaplex.fusion();
 * ```
 *
 * @example
 * You can create a new Fusion with minimum input like so.
 * By default, the current identity of the Metaplex instance will be
 * the authority of the Fusion.
 *
 * ```ts
 * const { fusion } = await metaplex
 *   .fusion()
 *   .create({
 *     sellerFeeBasisPoints: 500, // 5% royalties
 *   };
 * ```
 *
 * @see {@link Fusion} The `Fusion` model
 * @group Modules
 */
export class FusionClient {
  constructor(protected readonly metaplex: Metaplex) {}

  /**
   * You may use the `builders()` client to access the
   * underlying Transaction Builders of this module.
   *
   * ```ts
   * const buildersClient = metaplex.auctions().builders();
   * ```
   */
  builders() {
    return new FusionBuildersClient(this.metaplex);
  }

  /**
   * You may use the `pdas()` client to build PDAs related to this module.
   *
   * ```ts
   * const pdasClient = metaplex.fusion().pdas();
   * ```
   */
  pdas() {
    return new FusionPdasClient(this.metaplex);
  }

  /** {@inheritDoc createFusionOperation} */
  create(input: CreateFusionParentInput, options?: OperationOptions) {
    return this.metaplex
      .operations()
      .execute(createFusionParentOperation(input), options);
  }
}
