import { PublicKey } from '@solana/web3.js';
import { MetaplexError, MetaplexErrorInputWithoutSource } from './MetaplexError';

export class CandyMachineError extends MetaplexError {
  constructor(input: MetaplexErrorInputWithoutSource) {
    super({
      ...input,
      key: `plugin.candy_machine.${input.key}`,
      title: `Candy Machine > ${input.title}`,
      source: 'plugin',
      sourceDetails: 'Candy Machine',
    });
  }
}

export class CandyMachineNotFoundError extends CandyMachineError {
  constructor(candyMachineAddress: PublicKey, cause?: Error) {
    super({
      cause,
      key: 'candy_machine_not_found',
      title: 'CandyMachine Not Found',
      problem:
        'No account could be found for the provided candy machine address: ' +
        `[${candyMachineAddress.toBase58()}].`,
      solution:
        'Ensure the provided candy machine address is valid and that an associated ' +
        'Metadata account exists on the blockchain.',
    });
  }
}

export class CreatedCandyMachineNotFoundError extends CandyMachineError {
  constructor(candyMachineAddress: PublicKey, cause?: Error) {
    super({
      cause,
      key: 'created_candy_machine_not_found',
      title: 'Created CandyMachine Not Found',
      problem:
        'No account could be found for the candy machine that the client just created: ' +
        `[${candyMachineAddress.toBase58()}].`,
      solution:
        'Ensure that the candy machine could be created properly and without errors.' +
        'If the problem persists please file an issue.',
    });
  }
}

export class UpdatedCandyMachineNotFoundError extends CandyMachineError {
  constructor(candyMachineAddress: PublicKey, cause?: Error) {
    super({
      cause,
      key: 'updated_candy_machine_not_found',
      title: 'Updated CandyMachine Not Found',
      problem:
        'No account could be found for the candy machine that the client just updated: ' +
        `[${candyMachineAddress.toBase58()}].`,
      solution:
        'Ensure that the candy machine could be updated properly and without errors.' +
        'If the problem persists please file an issue.',
    });
  }
}
