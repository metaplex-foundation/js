import {
  CandyMachineData,
  createInitializeCandyMachineInstruction,
  InitializeCandyMachineInstructionAccounts,
  InitializeCandyMachineInstructionArgs,
  PROGRAM_ID as CANDY_MACHINE_PROGRAM_ID,
} from '@metaplex-foundation/mpl-candy-machine';
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createAccountBuilder } from '../../../programs';
import { getSpaceForCandy } from '../../../programs/candyMachine/accounts/candyMachineSpace';
import { Signer, TransactionBuilder } from '../../../shared';
import { logDebug } from '../../../utils';
import { InitCandyMachineInput } from '../operations';

export type InitCandyMachineBuilderParams = Omit<InitCandyMachineInput, 'confirmOptions'> & {
  confirmOptions: InitCandyMachineInput['confirmOptions'];
  connection: Connection;
};

export async function initCandyMachineBuilder(
  params: InitCandyMachineBuilderParams
): Promise<TransactionBuilder> {
  const {
    candyMachineData,
    candyMachineSigner,
    walletAddress,
    payerSigner: payer,
    authorityAddress,
    connection,
  } = params;
  const args: InitializeCandyMachineInstructionArgs = { data: candyMachineData };
  const accounts: InitializeCandyMachineInstructionAccounts = {
    candyMachine: candyMachineSigner.publicKey,
    wallet: walletAddress,
    payer: payer.publicKey,
    authority: authorityAddress,
  };
  const initCandyMachineIx = createInitializeCandyMachineInstruction(accounts, args);
  const createCandyMachine = await createCandyMachineAccountBuilder(
    payer,
    candyMachineSigner,
    candyMachineData,
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
  candyMachineData: CandyMachineData,
  connection: Connection
) {
  const space = getSpaceForCandy(candyMachineData);
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
