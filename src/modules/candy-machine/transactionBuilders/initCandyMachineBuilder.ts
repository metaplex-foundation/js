import {
  createInitializeCandyMachineInstruction,
  InitializeCandyMachineInstructionAccounts,
  InitializeCandyMachineInstructionArgs,
  PROGRAM_ID as CANDY_MACHINE_PROGRAM_ID,
} from '@metaplex-foundation/mpl-candy-machine';
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createAccountBuilder } from '../../../programs';
import { Signer, TransactionBuilder } from '../../../shared';
import { logDebug } from '../../../utils';
import { CandyMachineModel } from '../models/CandyMachine';
import { InitCandyMachineInput } from '../operations';

export type InitCandyMachineBuilderParams = Required<
  Omit<InitCandyMachineInput, 'confirmOptions'>
> & { confirmOptions: InitCandyMachineInput['confirmOptions']; connection: Connection };

export async function initCandyMachineBuilder(
  params: InitCandyMachineBuilderParams
): Promise<TransactionBuilder> {
  const { candyMachineModel, candyMachine, wallet, payer, authority, connection } = params;
  const candyMachineData = candyMachineModel.getData(candyMachine.publicKey);

  const args: InitializeCandyMachineInstructionArgs = { data: candyMachineData };
  const accounts: InitializeCandyMachineInstructionAccounts = {
    candyMachine: candyMachine.publicKey,
    wallet,
    payer: payer.publicKey,
    authority,
  };
  const initCandyMachineIx = createInitializeCandyMachineInstruction(accounts, args);
  const createCandyMachine = await createCandyMachineAccountBuilder(
    payer,
    candyMachine,
    candyMachineModel,
    connection
  );

  return TransactionBuilder.make()
    .add(createCandyMachine)
    .add({
      instruction: initCandyMachineIx,
      signers: [payer],
      key: 'initializeCandyMachine',
    });
}

async function createCandyMachineAccountBuilder(
  payer: Signer,
  candyMachine: Signer,
  candyMachineModel: CandyMachineModel,
  connection: Connection
) {
  const space = candyMachineModel.getSize(candyMachine.publicKey);
  const lamports = await connection.getMinimumBalanceForRentExemption(space);
  logDebug(
    `Creating candy machine account with space ${space} ` +
      `and balance of ${lamports / LAMPORTS_PER_SOL} SOL`
  );
  return createAccountBuilder({
    payer,
    newAccount: candyMachine,
    space,
    lamports,
    program: CANDY_MACHINE_PROGRAM_ID,
  });
}
