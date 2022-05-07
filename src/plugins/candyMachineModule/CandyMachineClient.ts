import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import { ModuleClient, Signer, convertToPublickKey } from '@/types';
import { CandyMachineConfigWithoutStorage, candyMachineDataFromConfig } from './config';
import {
  CreateCandyMachineInput,
  createCandyMachineOperation,
  CreateCandyMachineOutput,
} from './createCandyMachine';
import { findCandyMachineByAdddressOperation } from './findCandyMachineByAddress';
import { CandyMachine } from './CandyMachine';

export type CandyMachineInitFromConfigOpts = {
  candyMachineSigner?: Signer;
  authorityAddress?: PublicKey;
  confirmOptions?: ConfirmOptions;
};

export class CandyMachineClient extends ModuleClient {
  findCandyMachineByAddress(address: PublicKey): Promise<CandyMachine> {
    const operation = findCandyMachineByAdddressOperation(address);
    return this.metaplex.operations().execute(operation);
  }

  async createCandyMachine(
    input: CreateCandyMachineInput
  ): Promise<CreateCandyMachineOutput & { candyMachine: CandyMachine }> {
    const operation = createCandyMachineOperation(input);
    const output = await this.metaplex.operations().execute(operation);

    // TODO(thlorenz): gracefully handle if not found.
    const candyMachine = await this.findCandyMachineByAddress(output.candyMachineSigner.publicKey);

    return { candyMachine, ...output };
  }

  createCandyMachineFromConfig(
    config: CandyMachineConfigWithoutStorage,
    opts: CandyMachineInitFromConfigOpts
  ): Promise<CreateCandyMachineOutput & { candyMachine: CandyMachine }> {
    const { candyMachineSigner = Keypair.generate() } = opts;
    const candyMachineData = candyMachineDataFromConfig(config, candyMachineSigner.publicKey);
    const walletAddress = convertToPublickKey(config.solTreasuryAccount);

    return this.createCandyMachine({
      candyMachineSigner,
      walletAddress,
      authorityAddress: opts.authorityAddress,
      ...candyMachineData,
    });
  }
}
