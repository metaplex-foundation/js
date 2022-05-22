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

export type CandyMachineInitFromConfigOpts = {
  candyMachineSigner?: Signer;
  authorityAddress?: PublicKey;
  confirmOptions?: ConfirmOptions;
};

export async function create(
  this: CandyMachineClient,
  input: CreateCandyMachineInput
): Promise<CreateCandyMachineOutput & { candyMachine: CandyMachine }> {
  const operation = createCandyMachineOperation(input);
  const output = await this.metaplex.operations().execute(operation);

  const candyMachine = await this.findByAddress(
    output.candyMachineSigner.publicKey
  );
  if (candyMachine === null) {
    throw new CreatedCandyMachineNotFoundError(
      output.candyMachineSigner.publicKey
    );
  }

  return { candyMachine, ...output };
}

export async function createFromConfig(
  this: CandyMachineClient,
  config: CandyMachineConfigWithoutStorage,
  opts: CandyMachineInitFromConfigOpts
): Promise<CreateCandyMachineOutput & { candyMachine: CandyMachine }> {
  const { candyMachineSigner = Keypair.generate() } = opts;
  const candyMachineData = candyMachineDataFromConfig(
    config,
    candyMachineSigner.publicKey
  );
  const walletAddress = convertToPublickKey(config.solTreasuryAccount);

  return this.create({
    candyMachineSigner,
    walletAddress,
    authorityAddress: opts.authorityAddress,
    ...candyMachineData,
  });
}
