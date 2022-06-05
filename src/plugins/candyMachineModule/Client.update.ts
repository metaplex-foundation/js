import type { CandyMachineClient } from './CandyMachineClient';
import {
  CandyMachineAlreadyHasThisAuthorityError,
  CandyMachineToUpdateNotFoundError,
  UpdatedCandyMachineNotFoundError,
} from '@/errors';
import { CandyMachine } from './CandyMachine';
import {
  UpdateCandyMachineInputWithoutCandyMachineData,
  updateCandyMachineOperation,
  UpdateCandyMachineOutput,
} from './updateCandyMachine';
import { CandyMachineData } from '@metaplex-foundation/mpl-candy-machine';
import {
  UpdateAuthorityInput,
  updateAuthorityOperation,
  UpdateAuthorityOutput,
} from './updateAuthority';

export type UpdateCandyMachineParams =
  UpdateCandyMachineInputWithoutCandyMachineData & Partial<CandyMachineData>;

export type UpdateCandyMachineAuthorityParams = UpdateAuthorityInput;

export async function update(
  this: CandyMachineClient,
  input: UpdateCandyMachineParams
): Promise<UpdateCandyMachineOutput & { candyMachine: CandyMachine }> {
  const currentCandyMachine = await this.findByAddress(
    input.candyMachineAddress
  );
  if (currentCandyMachine == null) {
    throw new CandyMachineToUpdateNotFoundError(input.candyMachineAddress);
  }

  const updatedData = currentCandyMachine.updatedCandyMachineData(input);

  const operation = updateCandyMachineOperation({ ...input, ...updatedData });
  const output = await this.metaplex.operations().execute(operation);

  const candyMachine = await this.findByAddress(input.candyMachineAddress);
  if (candyMachine == null) {
    throw new UpdatedCandyMachineNotFoundError(input.candyMachineAddress);
  }

  return { candyMachine, ...output };
}

export async function updateAuthority(
  this: CandyMachineClient,
  input: UpdateCandyMachineAuthorityParams
): Promise<UpdateAuthorityOutput & { candyMachine: CandyMachine }> {
  const currentCandyMachine = await this.findByAddress(
    input.candyMachineAddress
  );
  if (currentCandyMachine == null) {
    throw new CandyMachineToUpdateNotFoundError(input.candyMachineAddress);
  }

  if (currentCandyMachine.authorityAddress.equals(input.newAuthorityAddress)) {
    throw new CandyMachineAlreadyHasThisAuthorityError(
      input.newAuthorityAddress
    );
  }

  const operation = updateAuthorityOperation(input);
  const output = await this.metaplex.operations().execute(operation);

  const candyMachine = await this.findByAddress(input.candyMachineAddress);
  if (candyMachine == null) {
    throw new UpdatedCandyMachineNotFoundError(input.candyMachineAddress);
  }

  return { candyMachine, ...output };
}
