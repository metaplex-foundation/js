import {
  createFusionParentBuilder,
  CreateFusionParentBuilderParams,
} from './operations';
import type { Metaplex } from '@/Metaplex';
import { TransactionBuilderOptions } from '@/utils';

/**
 * This client allows you to access the underlying Transaction Builders
 * for the write operations of the Auction House module.
 *
 * @see {@link FusionClient}
 * @group Module Builders
 * */
export class FusionBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  /** {@inheritDoc createBidBuilder} */
  create(
    input: CreateFusionParentBuilderParams,
    options?: TransactionBuilderOptions
  ) {
    return createFusionParentBuilder(this.metaplex, input, options);
  }
}