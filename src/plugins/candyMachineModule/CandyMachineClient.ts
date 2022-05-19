import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import { ModuleClient, Signer, convertToPublickKey } from '@/types';
import {
  CandyMachineAlreadyHasThisAuthorityError,
  CandyMachinesNotFoundByAuthorityError,
  CandyMachineToUpdateNotFoundError,
  CreatedCandyMachineNotFoundError,
  MoreThanOneCandyMachineFoundByAuthorityAndUuidError,
  NoCandyMachineFoundForAuthorityMatchesUuidError,
  UpdatedCandyMachineNotFoundError,
} from '@/errors';
import {
  CandyMachineConfigWithoutStorage,
  candyMachineDataFromConfig,
} from './config';
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
import {
  UpdateAuthorityInput,
  updateAuthorityOperation,
  UpdateAuthorityOutput,
} from './updateAuthority';

export type CandyMachineInitFromConfigOpts = {
  candyMachineSigner?: Signer;
  authorityAddress?: PublicKey;
  confirmOptions?: ConfirmOptions;
};
export type UpdateCandyMachineParams =
  UpdateCandyMachineInputWithoutCandyMachineData & Partial<CandyMachineData>;

export type UpdateCandyMachineAuthorityParams = UpdateAuthorityInput;

export class CandyMachineClient extends ModuleClient {
  // -----------------
  // Queries
  // -----------------
  findByAddress(address: PublicKey): Promise<CandyMachine | null> {
    const operation = findCandyMachineByAdddressOperation(address);
    return this.metaplex.operations().execute(operation);
  }

  findAllByWallet(walletAddress: PublicKey): Promise<CandyMachine[]> {
    return this.metaplex.operations().execute(
      findCandyMachinesByPublicKeyFieldOperation({
        type: 'wallet',
        publicKey: walletAddress,
      })
    );
  }

  findAllByAuthority(authorityAddress: PublicKey): Promise<CandyMachine[]> {
    return this.metaplex.operations().execute(
      findCandyMachinesByPublicKeyFieldOperation({
        type: 'authority',
        publicKey: authorityAddress,
      })
    );
  }

  async findByAuthorityAndUuid(
    authorityAddress: PublicKey,
    uuid: string
  ): Promise<CandyMachine> {
    const candyMachinesForAuthority = await this.findAllByAuthority(
      authorityAddress
    );
    if (candyMachinesForAuthority.length === 0) {
      throw new CandyMachinesNotFoundByAuthorityError(authorityAddress);
    }
    const matchingUUid = candyMachinesForAuthority.filter(
      (candyMachine) => candyMachine.uuid === uuid
    );
    if (matchingUUid.length === 0) {
      const addresses = candyMachinesForAuthority.map(
        (candyMachine) => candyMachine.candyMachineAccount.publicKey
      );
      throw new NoCandyMachineFoundForAuthorityMatchesUuidError(
        authorityAddress,
        uuid,
        addresses
      );
    }
    if (matchingUUid.length > 1) {
      const addresses = matchingUUid.map(
        (candyMachine) => candyMachine.candyMachineAccount.publicKey
      );
      throw new MoreThanOneCandyMachineFoundByAuthorityAndUuidError(
        authorityAddress,
        uuid,
        addresses
      );
    }
    return matchingUUid[0];
  }

  // -----------------
  // Create
  // -----------------
  async create(
    input: CreateCandyMachineInput
  ): Promise<CreateCandyMachineOutput & { candyMachine: CandyMachine }> {
    const operation = createCandyMachineOperation(input);
    const output = await this.metaplex.operations().execute(operation);

    const candyMachine = await this.findByAddress(
      output.candyMachineSigner.publicKey
    );
    if (candyMachine === null) {
      throw new CreatedCandyMachineNotFoundError(
        output.candyMachineSigner.publicKey
      );
    }

    return { candyMachine, ...output };
  }

  createFromConfig(
    config: CandyMachineConfigWithoutStorage,
    opts: CandyMachineInitFromConfigOpts
  ): Promise<CreateCandyMachineOutput & { candyMachine: CandyMachine }> {
    const { candyMachineSigner = Keypair.generate() } = opts;
    const candyMachineData = candyMachineDataFromConfig(
      config,
      candyMachineSigner.publicKey
    );
    const walletAddress = convertToPublickKey(config.solTreasuryAccount);

    return this.create({
      candyMachineSigner,
      walletAddress,
      authorityAddress: opts.authorityAddress,
      ...candyMachineData,
    });
  }

  // -----------------
  // Update
  // -----------------
  async update(
    input: UpdateCandyMachineParams
  ): Promise<UpdateCandyMachineOutput & { candyMachine: CandyMachine }> {
    const currentCandyMachine = await this.findByAddress(
      input.candyMachineAddress
    );
    if (currentCandyMachine == null) {
      throw new CandyMachineToUpdateNotFoundError(input.candyMachineAddress);
    }

    const updatedData = currentCandyMachine.updatedCandyMachineData(input);

    const operation = updateCandyMachineOperation({ ...input, ...updatedData });
    const output = await this.metaplex.operations().execute(operation);

    const candyMachine = await this.findByAddress(input.candyMachineAddress);
    if (candyMachine == null) {
      throw new UpdatedCandyMachineNotFoundError(input.candyMachineAddress);
    }

    return { candyMachine, ...output };
  }

  async updateAuthority(
    input: UpdateCandyMachineAuthorityParams
  ): Promise<UpdateAuthorityOutput & { candyMachine: CandyMachine }> {
    const currentCandyMachine = await this.findByAddress(
      input.candyMachineAddress
    );
    if (currentCandyMachine == null) {
      throw new CandyMachineToUpdateNotFoundError(input.candyMachineAddress);
    }

    if (
      currentCandyMachine.authorityAddress.equals(input.newAuthorityAddress)
    ) {
      throw new CandyMachineAlreadyHasThisAuthorityError(
        input.newAuthorityAddress
      );
    }

    const operation = updateAuthorityOperation(input);
    const output = await this.metaplex.operations().execute(operation);

    const candyMachine = await this.findByAddress(input.candyMachineAddress);
    if (candyMachine == null) {
      throw new UpdatedCandyMachineNotFoundError(input.candyMachineAddress);
    }

    return { candyMachine, ...output };
  }
}
