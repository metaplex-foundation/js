import { TransactionBuilder } from '../../../shared';
import { InitCandyMachineInput } from '../operations';

export type InitCandyMachineBuilderParams = InitCandyMachineInput;

export function initCandyMachineBuilder(
  _params: InitCandyMachineBuilderParams
): TransactionBuilder {
  // TODO(thlorenz): Add createInitializeCandyMachineInstruction
  return TransactionBuilder.make();
}
