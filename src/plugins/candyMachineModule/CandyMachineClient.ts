import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import { ModuleClient, Signer, convertToPublickKey } from '@/types';
import { CreatedCandyMachineNotFoundError, UpdatedCandyMachineNotFoundError } from '@/errors';
import { CandyMachineConfigWithoutStorage, candyMachineDataFromConfig } from './config';
import {
  CreateCandyMachineInput,
  createCandyMachineOperation,
  CreateCandyMachineOutput,
} from './createCandyMachine';
import { findCandyMachineByAdddressOperation } from './findCandyMachineByAddress';
import { findCandyMachinesByPublicKeyFieldOperation } from './findCandyMachinesByPublicKeyField';
import { CandyMachine } from './CandyMachine';
import {
  UpdateCandyMachineInput,
  updateCandyMachineOperation,
  UpdateCandyMachineOutput,
} from './updateCandyMachine';

export type CandyMachineInitFromConfigOpts = {
  candyMachineSigner?: Signer;
  authorityAddress?: PublicKey;
  confirmOptions?: ConfirmOptions;
};

export class CandyMachineClient extends ModuleClient {
  // -----------------
  // Queries
  // -----------------
  findCandyMachineByAddress(address: PublicKey): Promise<CandyMachine | null> {
    const operation = findCandyMachineByAdddressOperation(address);
    return this.metaplex.operations().execute(operation);
  }

  findCandyMachinesByWallet(wallet: PublicKey): Promise<CandyMachine[]> {
    return this.metaplex.operations().execute(
      findCandyMachinesByPublicKeyFieldOperation({
        type: 'wallet',
        publicKey: wallet,
      })
    );
  }

  findCandyMachinesByAuthority(authority: PublicKey): Promise<CandyMachine[]> {
    return this.metaplex.operations().execute(
      findCandyMachinesByPublicKeyFieldOperation({
        type: 'authority',
        publicKey: authority,
      })
    );
  }

  // -----------------
  // Create
  // -----------------
  async createCandyMachine(
    input: CreateCandyMachineInput
  ): Promise<CreateCandyMachineOutput & { candyMachine: CandyMachine }> {
    const operation = createCandyMachineOperation(input);
    const output = await this.metaplex.operations().execute(operation);

    const candyMachine = await this.findCandyMachineByAddress(output.candyMachineSigner.publicKey);
    if (candyMachine === null) {
      throw new CreatedCandyMachineNotFoundError(output.candyMachineSigner.publicKey);
    }

    return { candyMachine, ...output };
  }

  createCandyMachineFromConfig(
    config: CandyMachineConfigWithoutStorage,
    opts: CandyMachineInitFromConfigOpts
  ): Promise<CreateCandyMachineOutput & { candyMachine: CandyMachine }> {
    const { candyMachineSigner = Keypair.generate() } = opts;
    const candyMachineData = candyMachineDataFromConfig(config, candyMachineSigner.publicKey);
    const walletAddress = convertToPublickKey(config.solTreasuryAccount);

    return this.createCandyMachine({
      candyMachineSigner,
      walletAddress,
      authorityAddress: opts.authorityAddress,
      ...candyMachineData,
    });
  }

  // -----------------
  // Update
  // -----------------
  async updateCandyMachine(
    input: UpdateCandyMachineInput
  ): Promise<UpdateCandyMachineOutput & { candyMachine: CandyMachine }> {
    const operation = updateCandyMachineOperation(input);
    const output = await this.metaplex.operations().execute(operation);

    const candyMachine = await this.findCandyMachineByAddress(input.candyMachineAddress);
    if (candyMachine === null) {
      throw new UpdatedCandyMachineNotFoundError(input.candyMachineAddress);
    }

    return { candyMachine, ...output };
  }
}
