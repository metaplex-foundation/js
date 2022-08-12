import type { Metaplex } from '@/Metaplex';
import {
  createAccountBuilder,
  CreateAccountBuilderParams,
} from './createAccount';
import { transferSolBuilder, TransferSolBuilderParams } from './transferSol';

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
