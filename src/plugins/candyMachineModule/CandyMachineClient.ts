import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import { ModuleClient, Signer, tryConvertToPublickKey, IdentityDriver } from '@/types';
import { Optional, assert } from '@/utils';
import { CandyMachineConfigWithoutStorage, candyMachineDataFromConfig } from './config';
import {
  CreateCandyMachineInput,
  createCandyMachineOperation,
  CreateCandyMachineOutput,
} from './createCandyMachine';
import { findCandyMachineByAdddressOperation } from './findCandyMachineByAddress';

export type CreateCandyMachineParams = Optional<
  CreateCandyMachineInput,
  'payerSigner' | 'candyMachineSigner' | 'authorityAddress'
>;

export type CandyMachineInitFromConfigOpts = {
  candyMachineSigner?: Signer;
  authorityAddress?: PublicKey;
  confirmOptions?: ConfirmOptions;
};

export function toCandyMachineInitInput(
  params: CreateCandyMachineParams,
  identity: IdentityDriver
): CreateCandyMachineInput {
  const { payerSigner = identity } = params;
  assert(payerSigner != null, 'params.payer or identityDriver is required');

  const { candyMachineSigner = Keypair.generate(), authorityAddress = payerSigner.publicKey } =
    params;

  return {
    ...params,
    payerSigner,
    candyMachineSigner,
    authorityAddress,
  };
}

export class CandyMachineClient extends ModuleClient {
  async createCandyMachine(params: CreateCandyMachineParams) {
    const input = toCandyMachineInitInput(params, this.metaplex.identity());
    const initOperation = createCandyMachineOperation(input);
    const initCandyMachineOutput: CreateCandyMachineOutput = await this.metaplex
      .operations()
      .execute(initOperation);
    const { candyMachineSigner, ...rest } = initCandyMachineOutput;

    const findOperation = findCandyMachineByAdddressOperation(candyMachineSigner.publicKey);

    // TODO(thlorenz): gracefully handle if not found
    const candyMachine = await this.metaplex.operations().execute(findOperation);

    return { ...rest, candyMachineSigner, candyMachine };
  }

  createCandyMachineFromConfig(
    config: CandyMachineConfigWithoutStorage,
    opts: CandyMachineInitFromConfigOpts
  ) {
    const { candyMachineSigner = Keypair.generate() } = opts;
    const candyMachineData = candyMachineDataFromConfig(config, candyMachineSigner.publicKey);

    const walletAddress = tryConvertToPublickKey(config.solTreasuryAccount);

    const params: CreateCandyMachineParams = {
      walletAddress,
      candyMachineSigner,
      candyMachineData,
      authorityAddress: opts.authorityAddress,
    };

    return this.createCandyMachine(params);
  }
}
