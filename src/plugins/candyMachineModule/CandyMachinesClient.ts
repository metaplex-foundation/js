import type { PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import {
  CreateCandyMachineInput,
  CreateCandyMachineInputWithoutConfigs,
  createCandyMachineOperation,
  CreateCandyMachineOutput,
} from './createCandyMachine';
import { Task } from '@/utils';
import { CandyMachine } from './CandyMachine';
import {
  CandyMachineJsonConfigs,
  toCandyMachineConfigsFromJson,
} from './CandyMachineJsonConfigs';
import {
  findCandyMachineByAddressOperation,
  FindCandyMachineByAddressInput,
} from './findCandyMachineByAddress';
import {
  FindCandyMachinesByPublicKeyFieldInput,
  findCandyMachinesByPublicKeyFieldOperation,
} from './findCandyMachinesByPublicKeyField';
import {
  UpdateCandyMachineInput,
  UpdateCandyMachineInputWithoutConfigs,
  updateCandyMachineOperation,
  UpdateCandyMachineOutput,
} from './updateCandyMachine';
import {
  InsertItemsToCandyMachineInput,
  insertItemsToCandyMachineOperation,
  InsertItemsToCandyMachineOutput,
} from './insertItemsToCandyMachine';
import { CandyMachinesBuildersClient } from './CandyMachinesBuildersClient';

export class CandyMachinesClient {
  constructor(readonly metaplex: Metaplex) {}

  builders() {
    return new CandyMachinesBuildersClient(this.metaplex);
  }

  create(
    input: CreateCandyMachineInput
  ): Task<CreateCandyMachineOutput & { candyMachine: CandyMachine }> {
    return new Task(async (scope) => {
      const operation = createCandyMachineOperation(input);
      const output = await this.metaplex.operations().execute(operation, scope);
      scope.throwIfCanceled();
      const candyMachine = await this.findByAddress(
        output.candyMachineSigner.publicKey
      ).run(scope);
      return { ...output, candyMachine };
    });
  }

  createFromJsonConfig(
    input: CreateCandyMachineInputWithoutConfigs & {
      authority?: PublicKey;
      json: CandyMachineJsonConfigs;
    }
  ) {
    const { json, authority, ...otherInputs } = input;
    const configs = toCandyMachineConfigsFromJson(
      authority ?? this.metaplex.identity().publicKey,
      json
    );
    return this.create({ ...otherInputs, ...configs });
  }

  findAllByWallet(
    wallet: PublicKey,
    options?: Omit<FindCandyMachinesByPublicKeyFieldInput, 'type' | 'publicKey'>
  ): Task<CandyMachine[]> {
    return this.metaplex.operations().getTask(
      findCandyMachinesByPublicKeyFieldOperation({
        type: 'wallet',
        publicKey: wallet,
        ...options,
      })
    );
  }

  findAllByAuthority(
    authority: PublicKey,
    options?: Omit<FindCandyMachinesByPublicKeyFieldInput, 'type' | 'publicKey'>
  ): Task<CandyMachine[]> {
    return this.metaplex.operations().getTask(
      findCandyMachinesByPublicKeyFieldOperation({
        type: 'authority',
        publicKey: authority,
        ...options,
      })
    );
  }

  findByAddress(
    address: PublicKey,
    options?: Omit<FindCandyMachineByAddressInput, 'type' | 'publicKey'>
  ): Task<CandyMachine> {
    return this.metaplex
      .operations()
      .getTask(findCandyMachineByAddressOperation({ address, ...options }));
  }

  insertItems(
    candyMachine: CandyMachine,
    input: Omit<InsertItemsToCandyMachineInput, 'candyMachine'>
  ): Task<InsertItemsToCandyMachineOutput & { candyMachine: CandyMachine }> {
    return new Task(async (scope) => {
      const operation = insertItemsToCandyMachineOperation({
        candyMachine,
        ...input,
      });
      const output = await this.metaplex.operations().execute(operation, scope);
      scope.throwIfCanceled();
      const updatedCandyMachine = await this.findByAddress(
        candyMachine.address
      ).run();
      return { candyMachine: updatedCandyMachine, ...output };
    });
  }

  update(
    candyMachine: CandyMachine,
    input: Omit<UpdateCandyMachineInput, 'candyMachine'>
  ): Task<UpdateCandyMachineOutput & { candyMachine: CandyMachine }> {
    return new Task(async (scope) => {
      const output = await this.metaplex
        .operations()
        .execute(
          updateCandyMachineOperation({ candyMachine, ...input }),
          scope
        );
      scope.throwIfCanceled();
      const updatedCandyMachine = await this.findByAddress(
        candyMachine.address
      ).run();
      return { candyMachine: updatedCandyMachine, ...output };
    });
  }

  updateFromJsonConfig(
    candyMachine: CandyMachine,
    input: Omit<UpdateCandyMachineInputWithoutConfigs, 'candyMachine'> & {
      newAuthority?: PublicKey;
      json: CandyMachineJsonConfigs;
    }
  ) {
    const { json, newAuthority, ...otherInputs } = input;
    const configs = toCandyMachineConfigsFromJson(
      newAuthority ?? candyMachine.authorityAddress,
      json
    );
    return this.update(candyMachine, { ...otherInputs, ...configs });
  }
}
