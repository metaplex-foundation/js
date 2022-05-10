import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import { ModuleClient, Signer, convertToPublickKey } from '@/types';
import {
  CandyMachinesNotFoundByAuthority,
  CandyMachineToUpdateNotFoundError,
  CreatedCandyMachineNotFoundError,
  MoreThanOneCandyMachineFoundByAuthorityAndUuid,
  NoCandyMachineFoundForAuthorityMatchesUuid,
  UpdatedCandyMachineNotFoundError,
} from '@/errors';
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
  UpdateCandyMachineInputWithoutCandyMachineData,
  updateCandyMachineOperation,
  UpdateCandyMachineOutput,
} from './updateCandyMachine';
import { CandyMachineData } from '@metaplex-foundation/mpl-candy-machine';

export type CandyMachineInitFromConfigOpts = {
  candyMachineSigner?: Signer;
  authorityAddress?: PublicKey;
  confirmOptions?: ConfirmOptions;
};
export type UpdateCandyMachineParams = UpdateCandyMachineInputWithoutCandyMachineData &
  Partial<CandyMachineData>;

export class CandyMachineClient extends ModuleClient {
  // -----------------
  // Queries
  // -----------------
  findCandyMachineByAddress(address: PublicKey): Promise<CandyMachine | null> {
    const operation = findCandyMachineByAdddressOperation(address);
    return this.metaplex.operations().execute(operation);
  }

  findCandyMachinesByWallet(walletAddress: PublicKey): Promise<CandyMachine[]> {
    return this.metaplex.operations().execute(
      findCandyMachinesByPublicKeyFieldOperation({
        type: 'wallet',
        publicKey: walletAddress,
      })
    );
  }

  findCandyMachinesByAuthority(authorityAddress: PublicKey): Promise<CandyMachine[]> {
    return this.metaplex.operations().execute(
      findCandyMachinesByPublicKeyFieldOperation({
        type: 'authority',
        publicKey: authorityAddress,
      })
    );
  }

  async findCandyMachinesByAuthorityAndUuid(
    authorityAddress: PublicKey,
    uuid: string
  ): Promise<CandyMachine> {
    const candyMachinesForAuthority = await this.findCandyMachinesByAuthority(authorityAddress);
    if (candyMachinesForAuthority.length === 0) {
      throw new CandyMachinesNotFoundByAuthority(authorityAddress);
    }
    const matchingUUid = candyMachinesForAuthority.filter(
      (candyMachine) => candyMachine.uuid === uuid
    );
    if (matchingUUid.length === 0) {
      const addresses = candyMachinesForAuthority.map(
        (candyMachine) => candyMachine.candyMachineAccount.publicKey
      );
      throw new NoCandyMachineFoundForAuthorityMatchesUuid(authorityAddress, uuid, addresses);
    }
    if (matchingUUid.length > 1) {
      const addresses = matchingUUid.map(
        (candyMachine) => candyMachine.candyMachineAccount.publicKey
      );
      throw new MoreThanOneCandyMachineFoundByAuthorityAndUuid(authorityAddress, uuid, addresses);
    }
    return matchingUUid[0];
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
    input: UpdateCandyMachineParams
  ): Promise<UpdateCandyMachineOutput & { candyMachine: CandyMachine }> {
    const currentCandyMachine = await this.findCandyMachineByAddress(input.candyMachineAddress);
    if (currentCandyMachine === null) {
      throw new CandyMachineToUpdateNotFoundError(input.candyMachineAddress);
    }

    const updatedData = currentCandyMachine.updatedCandyMachineData(input);

    const operation = updateCandyMachineOperation({ ...input, ...updatedData });
    const output = await this.metaplex.operations().execute(operation);

    const candyMachine = await this.findCandyMachineByAddress(input.candyMachineAddress);
    if (candyMachine === null) {
      throw new UpdatedCandyMachineNotFoundError(input.candyMachineAddress);
    }

    return { candyMachine, ...output };
  }
}
