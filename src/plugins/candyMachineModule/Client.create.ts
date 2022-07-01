import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import { convertToPublickKey, Signer } from '@/types';
import {
  CandyMachineConfigWithoutStorage,
  candyMachineDataFromConfig,
} from './config';
import { CreateCandyMachineOutput } from './createCandyMachine';
import { CandyMachine } from './CandyMachine';
import type { CandyMachinesClient } from './CandyMachinesClient';

export type CandyMachineInitFromConfigOpts = {
  candyMachine?: Signer;
  authorityAddress?: PublicKey;
  confirmOptions?: ConfirmOptions;
};

export async function createFromConfig(
  this: CandyMachinesClient,
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
