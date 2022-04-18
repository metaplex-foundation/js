import {
  createInitializeCandyMachineInstruction,
  InitializeCandyMachineInstructionAccounts,
  InitializeCandyMachineInstructionArgs,
} from '@metaplex-foundation/mpl-candy-machine';
import { TransactionBuilder } from '../../../shared';
import { InitCandyMachineInput } from '../operations';

export type InitCandyMachineBuilderParams = Required<
  Omit<InitCandyMachineInput, 'confirmOptions'>
> & { confirmOptions: InitCandyMachineInput['confirmOptions'] };

export function initCandyMachineBuilder(params: InitCandyMachineBuilderParams): TransactionBuilder {
  const { candyMachineModel, candyMachine, wallet, payer, authority } = params;
  const candyMachineData = candyMachineModel.getData(candyMachine);

  const args: InitializeCandyMachineInstructionArgs = { data: candyMachineData };
  const accounts: InitializeCandyMachineInstructionAccounts = {
    candyMachine,
    wallet,
    payer,
    authority,
  };
  const instruction = createInitializeCandyMachineInstruction(accounts, args);

  return TransactionBuilder.make().add({
    instruction,
    signers: [], // TODO(thlorenz): assuming identity will be used to sign
    key: 'initializeCandyMachine',
  });
}
