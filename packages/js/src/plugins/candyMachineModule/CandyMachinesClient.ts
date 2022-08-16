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
 * @group Modules
 */
export class CandyMachinesClient {
  constructor(readonly metaplex: Metaplex) {}

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
