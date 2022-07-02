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
  getCandyMachineConfigsFromJson,
} from './CandyMachineJsonConfigs';
import { Commitment, PublicKey } from '@solana/web3.js';
import { findCandyMachineByAddressOperation } from './findCandyMachineByAddress';
import { findCandyMachinesByPublicKeyFieldOperation } from './findCandyMachinesByPublicKeyField';
import {
  UpdateCandyMachineInput,
  updateCandyMachineOperation,
  UpdateCandyMachineOutput,
} from './updateCandyMachine';
import {
  InsertItemsToCandyMachineInput,
  insertItemsToCandyMachineOperation,
  InsertItemsToCandyMachineOutput,
} from './insertItemsToCandyMachine';

export class CandyMachinesClient {
  constructor(readonly metaplex: Metaplex) {}

  create(input: CreateCandyMachineInput): Task<
    Omit<CreateCandyMachineOutput, 'candyMachine'> & {
      candyMachine: CandyMachine;
    }
  > {
    return new Task(async (scope) => {
      const operation = createCandyMachineOperation(input);
      const output = await this.metaplex.operations().execute(operation, scope);
      scope.throwIfCanceled();
      const candyMachine = await this.findByAddress(
        output.candyMachine.publicKey
      ).run(scope);
      return { ...output, candyMachine };
    });
  }

  createFromJsonConfig(
    input: CreateCandyMachineInputWithoutConfigs & {
      json: CandyMachineJsonConfigs;
    }
  ) {
    const { json, ...otherInputs } = input;
    const configs = getCandyMachineConfigsFromJson(json);
    return this.create({ ...otherInputs, ...configs });
  }

  findAllByWallet(
    wallet: PublicKey,
    options: { commitment?: Commitment } = {}
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
    options: { commitment?: Commitment } = {}
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
    options: { commitment?: Commitment } = {}
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
}
