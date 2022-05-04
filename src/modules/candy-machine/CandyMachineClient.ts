import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import { ModuleClient, Signer, tryConvertToPublickKey } from '../../shared';
import { CandyMachineConfigWithoutStorage, candyMachineDataFromConfig } from './config';
import {
  findCandyMachineByAdddressOperation,
  InitCandyMachineInput,
  initCandyMachineOperation,
  InitCandyMachineOutput,
} from './operations';
import { IdentityDriver } from '../../drivers';
import assert from '../../utils/assert';
import { Optional } from '../../utils';

export type CreateCandyMachineParams = Optional<
  InitCandyMachineInput,
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
): InitCandyMachineInput {
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
    const initOperation = initCandyMachineOperation(input);
    const initCandyMachineOutput: InitCandyMachineOutput = await this.metaplex
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
