import type { Metaplex } from '@/Metaplex';
import { toPublicKey } from '@/types';
import { Task } from '@/utils';
import type { PublicKey } from '@solana/web3.js';
import { NftWithToken } from '../nftModule';
import { CandyMachinesBuildersClient } from './CandyMachinesBuildersClient';
import { CandyMachineBotTaxError } from './errors';
import {
  CandyMachine,
  CandyMachineJsonConfigs,
  toCandyMachineConfigsFromJson,
} from './models';
import {
  CreateCandyMachineInput,
  CreateCandyMachineInputWithoutConfigs,
  createCandyMachineOperation,
  CreateCandyMachineOutput,
  DeleteCandyMachineInput,
  deleteCandyMachineOperation,
  DeleteCandyMachineOutput,
  FindCandyMachineByAddressInput,
  findCandyMachineByAddressOperation,
  FindCandyMachinesByPublicKeyFieldInput,
  findCandyMachinesByPublicKeyFieldOperation,
  FindMintedNftsByCandyMachineInput,
  findMintedNftsByCandyMachineOperation,
  FindMintedNftsByCandyMachineOutput,
  InsertItemsToCandyMachineInput,
  insertItemsToCandyMachineOperation,
  InsertItemsToCandyMachineOutput,
  MintCandyMachineInput,
  mintCandyMachineOperation,
  MintCandyMachineOutput,
  UpdateCandyMachineInput,
  UpdateCandyMachineInputWithoutConfigs,
  updateCandyMachineOperation,
  UpdateCandyMachineOutput,
} from './operations';

export class CandyMachinesClient {
  constructor(readonly metaplex: Metaplex) {}

  builders() {
    return new CandyMachinesBuildersClient(this.metaplex);
  }

  create(
    input: CreateCandyMachineInput
  ): Task<CreateCandyMachineOutput & { candyMachine: CandyMachine }> {
    return new Task(async (scope) => {
      const operation = createCandyMachineOperation(input);
      const output = await this.metaplex.operations().execute(operation, scope);
      scope.throwIfCanceled();
      const candyMachine = await this.findByAddress(
        output.candyMachineSigner.publicKey
      ).run(scope);
      return { ...output, candyMachine };
    });
  }

  createFromJsonConfig(
    input: CreateCandyMachineInputWithoutConfigs & {
      json: CandyMachineJsonConfigs;
    }
  ) {
    const { json, ...otherInputs } = input;
    const configs = toCandyMachineConfigsFromJson(json);
    return this.create({ ...otherInputs, ...configs });
  }

  delete(
    candyMachine: CandyMachine,
    options?: Omit<DeleteCandyMachineInput, 'candyMachine'>
  ): Task<DeleteCandyMachineOutput> {
    return this.metaplex
      .operations()
      .getTask(deleteCandyMachineOperation({ candyMachine, ...options }));
  }

  findAllByWallet(
    wallet: PublicKey,
    options?: Omit<FindCandyMachinesByPublicKeyFieldInput, 'type' | 'publicKey'>
  ): Task<CandyMachine[]> {
    return this.metaplex.operations().getTask(
      findCandyMachinesByPublicKeyFieldOperation({
        type: 'wallet',
        publicKey: wallet,
        ...options,
      })
    );
  }

  findAllByAuthority(
    authority: PublicKey,
    options?: Omit<FindCandyMachinesByPublicKeyFieldInput, 'type' | 'publicKey'>
  ): Task<CandyMachine[]> {
    return this.metaplex.operations().getTask(
      findCandyMachinesByPublicKeyFieldOperation({
        type: 'authority',
        publicKey: authority,
        ...options,
      })
    );
  }

  findByAddress(
    address: PublicKey,
    options?: Omit<FindCandyMachineByAddressInput, 'address'>
  ): Task<CandyMachine> {
    return this.metaplex
      .operations()
      .getTask(findCandyMachineByAddressOperation({ address, ...options }));
  }

  findMintedNfts(
    candyMachine: PublicKey,
    options?: Omit<FindMintedNftsByCandyMachineInput, 'candyMachine'>
  ): Task<FindMintedNftsByCandyMachineOutput> {
    return this.metaplex
      .operations()
      .getTask(
        findMintedNftsByCandyMachineOperation({ candyMachine, ...options })
      );
  }

  insertItems(
    candyMachine: CandyMachine,
    input: Omit<InsertItemsToCandyMachineInput, 'candyMachine'>
  ): Task<InsertItemsToCandyMachineOutput> {
    return this.metaplex.operations().getTask(
      insertItemsToCandyMachineOperation({
        candyMachine,
        ...input,
      })
    );
  }

  mint(
    candyMachine: CandyMachine,
    input: Omit<MintCandyMachineInput, 'candyMachine'> = {}
  ): Task<MintCandyMachineOutput & { nft: NftWithToken }> {
    return new Task(async (scope) => {
      const operation = mintCandyMachineOperation({ candyMachine, ...input });
      const output = await this.metaplex.operations().execute(operation, scope);
      scope.throwIfCanceled();

      let nft: NftWithToken;
      try {
        nft = (await this.metaplex
          .nfts()
          .findByMint(output.mintSigner.publicKey, {
            tokenAddress: output.tokenAddress,
          })
          .run(scope)) as NftWithToken;
      } catch (error) {
        throw new CandyMachineBotTaxError(
          this.metaplex.rpc().getSolanaExporerUrl(output.response.signature),
          error as Error
        );
      }
      return { nft, ...output };
    });
  }

  refresh(
    candyMachine: CandyMachine | PublicKey,
    options?: Omit<FindCandyMachineByAddressInput, 'address'>
  ): Task<CandyMachine> {
    return this.findByAddress(toPublicKey(candyMachine), options);
  }

  update(
    candyMachine: CandyMachine,
    input: Omit<UpdateCandyMachineInput, 'candyMachine'>
  ): Task<UpdateCandyMachineOutput> {
    return this.metaplex
      .operations()
      .getTask(updateCandyMachineOperation({ candyMachine, ...input }));
  }

  updateFromJsonConfig(
    candyMachine: CandyMachine,
    input: Omit<UpdateCandyMachineInputWithoutConfigs, 'candyMachine'> & {
      json: CandyMachineJsonConfigs;
    }
  ) {
    const { json, ...otherInputs } = input;
    const configs = toCandyMachineConfigsFromJson(json);
    return this.update(candyMachine, { ...otherInputs, ...configs });
  }
}
