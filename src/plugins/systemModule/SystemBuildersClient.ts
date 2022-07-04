import type { Metaplex } from '@/Metaplex';
import {
  createAccountBuilder,
  CreateAccountBuilderParams,
} from './createAccount';
import { transferSolBuilder, TransferSolBuilderParams } from './transferSol';

export class SystemBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  createAccount(input: CreateAccountBuilderParams) {
    return createAccountBuilder(this.metaplex, input);
  }

  transferSol(input: TransferSolBuilderParams) {
    return transferSolBuilder(this.metaplex, input);
  }
}
