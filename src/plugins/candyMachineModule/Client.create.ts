import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import { convertToPublickKey, Signer } from '@/types';
import { CreatedCandyMachineNotFoundError } from '@/errors';
import {
  CandyMachineConfigWithoutStorage,
  candyMachineDataFromConfig,
} from './config';
import {
  CreateCandyMachineInput,
  createCandyMachineOperation,
  CreateCandyMachineOutput,
} from './createCandyMachine';
import { CandyMachine } from './CandyMachine';
import type { CandyMachineClient } from './CandyMachineClient';
import { Task } from '@/utils';

export type CandyMachineInitFromConfigOpts = {
  candyMachine?: Signer;
  authorityAddress?: PublicKey;
  confirmOptions?: ConfirmOptions;
};

export function create(
  this: CandyMachineClient,
  input: CreateCandyMachineInput
): Task<
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
    );

    if (candyMachine === null) {
      throw new CreatedCandyMachineNotFoundError(output.candyMachine.publicKey);
    }

    return { ...output, candyMachine };
  });
}

export async function createFromConfig(
  this: CandyMachineClient,
  config: CandyMachineConfigWithoutStorage,
  opts: CandyMachineInitFromConfigOpts
): Promise<CreateCandyMachineOutput & { candyMachine: CandyMachine }> {
  const { candyMachine = Keypair.generate() } = opts;
  const candyMachineData = candyMachineDataFromConfig(
    config,
    candyMachine.publicKey
  );
  const walletAddress = convertToPublickKey(config.solTreasuryAccount);

  return this.create({
    candyMachine,
    walletAddress,
    authorityAddress: opts.authorityAddress,
    ...candyMachineData,
  });
}
