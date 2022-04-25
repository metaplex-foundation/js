import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { ModuleClient, Signer, tryConvertToPublickKey } from '../../shared';
import { CandyMachineModel } from './models/CandyMachine';
import { CandyMachineConfig, StorageConfig } from './models/config';
import { InitCandyMachineInput, initCandyMachineOperation } from './operations';

export type CandyMachineInitFromConfigOpts = {
  candyMachine?: Signer;
  authority?: PublicKey;
  confirmOptions?: ConfirmOptions;
};

export class CandyMachineClient extends ModuleClient {
  async initCandyMachine(input: InitCandyMachineInput) {
    const operation = initCandyMachineOperation(input);
    const initCandyMachineOutput = await this.metaplex.execute(operation);
    const { candyMachine: candyMachineSigner, ...rest } = initCandyMachineOutput;

    // TODO(thlorenz): gracefully handle if not found
    const candyMachine = await this.getCandyMachine(candyMachineSigner.publicKey);

    return { ...rest, candyMachineSigner, candyMachine };
  }

  initCandyMachineFromConfig(
    config: Omit<CandyMachineConfig, keyof StorageConfig>,
    { authority, candyMachine, confirmOptions }: CandyMachineInitFromConfigOpts = {}
  ) {
    const { solTreasuryAccount } = config;
    const candyMachineModel = CandyMachineModel.fromConfig(config);
    const input: InitCandyMachineInput = {
      wallet: tryConvertToPublickKey(solTreasuryAccount),
      candyMachine,
      authority,
      candyMachineModel,
      confirmOptions,
    };

    return this.initCandyMachine(input);
  }

  getCandyMachine(candyMachineAccount: PublicKey) {
    return CandyMachineModel.getCandyMachine(candyMachineAccount, this.metaplex.connection);
  }
}
