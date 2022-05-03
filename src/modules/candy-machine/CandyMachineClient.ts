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

export type CandyMachineInitParams = Optional<
  InitCandyMachineInput,
  'payerSigner' | 'candyMachineSigner' | 'authorityAddress'
>;

export type CandyMachineInitFromConfigOpts = {
  candyMachineSigner?: Signer;
  authorityAddress?: PublicKey;
  confirmOptions?: ConfirmOptions;
};

export function fillCandyMachineInitInput(
  params: CandyMachineInitParams,
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
  async initCandyMachine(params: CandyMachineInitParams) {
    const input = fillCandyMachineInitInput(params, this.metaplex.identity());
    const initOperation = initCandyMachineOperation(input);
    const initCandyMachineOutput: InitCandyMachineOutput = await this.metaplex.execute(
      initOperation
    );
    const { candyMachineSigner, ...rest } = initCandyMachineOutput;

    const findOperation = findCandyMachineByAdddressOperation(candyMachineSigner.publicKey);

    // TODO(thlorenz): gracefully handle if not found
    const candyMachine = await this.metaplex.execute(findOperation);

    return { ...rest, candyMachineSigner, candyMachine };
  }

  initCandyMachineFromConfig(
    config: CandyMachineConfigWithoutStorage,
    opts: CandyMachineInitFromConfigOpts
  ) {
    const { candyMachineSigner = Keypair.generate() } = opts;
    const candyMachineData = candyMachineDataFromConfig(config, candyMachineSigner.publicKey);

    const walletAddress = tryConvertToPublickKey(config.solTreasuryAccount);

    const params: CandyMachineInitParams = {
      walletAddress,
      candyMachineSigner,
      candyMachineData,
      authorityAddress: opts.authorityAddress,
    };

    return this.initCandyMachine(params);
  }
}
