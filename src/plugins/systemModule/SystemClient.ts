import type { Metaplex } from '@/Metaplex';
import { CreateAccountInput, createAccountOperation } from './createAccount';
import { SystemBuildersClient } from './SystemBuildersClient';
import { TransferSolInput, transferSolOperation } from './transferSol';

export class SystemClient {
  constructor(protected readonly metaplex: Metaplex) {}

  builders() {
    return new SystemBuildersClient(this.metaplex);
  }

  createAccount(input: CreateAccountInput) {
    return this.metaplex.operations().getTask(createAccountOperation(input));
  }

  transferSol(input: TransferSolInput) {
    return this.metaplex.operations().getTask(transferSolOperation(input));
  }
}
