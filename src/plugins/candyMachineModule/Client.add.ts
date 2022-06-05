import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { Signer } from '@/types';
import {
  CandyMachineToUpdateNotFoundError,
  UpdatedCandyMachineNotFoundError,
} from '@/errors';
import { ConfigLine } from '@metaplex-foundation/mpl-candy-machine';
import { AddConfigLinesInput, addConfigLinesOperation } from './addConfigLines';
import {
  assertAllConfigLineConstraints,
  assertCanAdd,
  assertNotFull,
} from './Client.helpers';
import type { CandyMachineClient } from './CandyMachineClient';

export type AddAssetsToCandyMachineParams = {
  // Accounts
  candyMachineAddress: PublicKey;
  authoritySigner: Signer;

  // Args
  assets: ConfigLine[];

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};

export async function addAssets(
  this: CandyMachineClient,
  params: AddAssetsToCandyMachineParams
) {
  const currentCandyMachine = await this.findByAddress(
    params.candyMachineAddress
  );
  if (currentCandyMachine == null) {
    throw new CandyMachineToUpdateNotFoundError(params.candyMachineAddress);
  }

  const index = currentCandyMachine.assetsCount;

  assertNotFull(currentCandyMachine, index);
  assertCanAdd(currentCandyMachine, index, params.assets.length);
  assertAllConfigLineConstraints(params.assets);

  const addConfigLinesInput: AddConfigLinesInput = {
    candyMachineAddress: params.candyMachineAddress,
    authoritySigner: params.authoritySigner,
    index,
    configLines: params.assets,
  };

  const addConfigLinesOutput = await this.metaplex
    .operations()
    .execute(addConfigLinesOperation(addConfigLinesInput));

  const candyMachine = await this.findByAddress(params.candyMachineAddress);
  if (currentCandyMachine == null) {
    throw new UpdatedCandyMachineNotFoundError(params.candyMachineAddress);
  }

  return {
    candyMachine,
    ...addConfigLinesOutput,
  };
}
