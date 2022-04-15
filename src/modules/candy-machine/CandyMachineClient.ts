import { ModuleClient } from '../../shared';
import { InitCandyMachineInput, InitCandyMachineOperation } from './operations';

export class CandyMachineClient extends ModuleClient {
  async initCandyMachine(input: InitCandyMachineInput) {
    const operation = new InitCandyMachineOperation(input);
    const initCandyMachineOutput = await this.metaplex.execute(operation);
    // TODO(thlorenz): find and verify (maybe compare) inited candy machine
    return initCandyMachineOutput;
  }
}
