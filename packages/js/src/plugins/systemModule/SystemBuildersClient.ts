import {
  createAccountBuilder,
  CreateAccountBuilderParams,
  transferSolBuilder,
  TransferSolBuilderParams,
} from './operations';
import type { Metaplex } from '@metaplex-foundation/js';

/**
 * This client allows you to access the underlying Transaction Builders
 * for the write operations of the System module.
 *
 * @see {@link SystemClient}
 * @group Module Builders
 * */
export class SystemBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  /** {@inheritDoc createAccountBuilder} */
  createAccount(input: CreateAccountBuilderParams) {
    return createAccountBuilder(this.metaplex, input);
  }

  /** {@inheritDoc transferSolBuilder} */
  transferSol(input: TransferSolBuilderParams) {
    return transferSolBuilder(this.metaplex, input);
  }
}
