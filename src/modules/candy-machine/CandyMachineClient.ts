import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { ModuleClient, tryConvertToPublickKey } from '../../shared';
import { CandyMachine } from './models/CandyMachine';
import { CandyMachineConfig, StorageConfig } from './models/config';
import { InitCandyMachineInput, InitCandyMachineOperation } from './operations';

export class CandyMachineClient extends ModuleClient {
  async initCandyMachine(input: InitCandyMachineInput) {
    const operation = new InitCandyMachineOperation(input);
    const initCandyMachineOutput = await this.metaplex.execute(operation);
    // TODO(thlorenz): find and verify (maybe compare) inited candy machine
    return initCandyMachineOutput;
  }

  initCandyMachineFromConfig(
    config: Omit<CandyMachineConfig, keyof StorageConfig>,
    payer: PublicKey,
    {
      authority,
      candyMachine,
      confirmOptions,
    }: {
      candyMachine?: PublicKey;
      authority?: PublicKey;
      confirmOptions?: ConfirmOptions;
    } = {}
  ) {
    const { solTreasuryAccount } = config;
    const candyMachineModel = CandyMachine.fromConfig(config);
    const input: InitCandyMachineInput = {
      payer,
      wallet: tryConvertToPublickKey(solTreasuryAccount),
      candyMachine,
      authority,
      candyMachineModel,
      confirmOptions,
    };

    return this.initCandyMachine(input);
  }
}
