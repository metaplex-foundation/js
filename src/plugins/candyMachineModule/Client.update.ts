import type { CandyMachinesClient } from './CandyMachinesClient';
import {
  CandyMachineAlreadyHasThisAuthorityError,
  CandyMachineToUpdateNotFoundError,
  UpdatedCandyMachineNotFoundError,
} from './errors';
import { CandyMachine } from './CandyMachine';
import {
  UpdateAuthorityInput,
  updateAuthorityOperation,
  UpdateAuthorityOutput,
} from './updateAuthority';

export async function updateAuthority(
  this: CandyMachinesClient,
  input: UpdateAuthorityInput
): Promise<UpdateAuthorityOutput & { candyMachine: CandyMachine }> {
  const currentCandyMachine = await this.findByAddress(
    input.candyMachineAddress
  ).run();
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

  const candyMachine = await this.findByAddress(
    input.candyMachineAddress
  ).run();
  if (candyMachine == null) {
    throw new UpdatedCandyMachineNotFoundError(input.candyMachineAddress);
  }

  return { candyMachine, ...output };
}
