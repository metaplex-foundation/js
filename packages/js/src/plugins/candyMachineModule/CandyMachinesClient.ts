import type { PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { CandyMachinesBuildersClient } from './CandyMachinesBuildersClient';
import { LazyNft, Nft } from '../nftModule';
import { Task } from '@/utils';
import { CandyMachine } from './CandyMachine';
import {
  CreateCandyMachineInput,
  CreateCandyMachineInputWithoutConfigs,
  createCandyMachineOperation,
  CreateCandyMachineOutput,
} from './createCandyMachine';
import {
  CandyMachineJsonConfigs,
  toCandyMachineConfigsFromJson,
} from './CandyMachineJsonConfigs';
import {
  findCandyMachineByAddressOperation,
  FindCandyMachineByAddressInput,
} from './findCandyMachineByAddress';
import {
  FindCandyMachinesByPublicKeyFieldInput,
  findCandyMachinesByPublicKeyFieldOperation,
} from './findCandyMachinesByPublicKeyField';
import {
  FindMintedNftsByCandyMachineInput,
  findMintedNftsByCandyMachineOperation,
} from './findMintedNftsByCandyMachine';
import {
  InsertItemsToCandyMachineInput,
  insertItemsToCandyMachineOperation,
  InsertItemsToCandyMachineOutput,
} from './insertItemsToCandyMachine';
import {
  UpdateCandyMachineInput,
  UpdateCandyMachineInputWithoutConfigs,
  updateCandyMachineOperation,
  UpdateCandyMachineOutput,
} from './updateCandyMachine';
import {
  MintCandyMachineInput,
  mintCandyMachineOperation,
  MintCandyMachineOutput,
} from './mintCandyMachine';
import { CandyMachineBotTaxError } from './errors';

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
    options?: Omit<FindCandyMachineByAddressInput, 'type' | 'publicKey'>
  ): Task<CandyMachine> {
    return this.metaplex
      .operations()
      .getTask(findCandyMachineByAddressOperation({ address, ...options }));
  }

  findMintedNfts(
    candyMachine: PublicKey,
    options?: Omit<FindMintedNftsByCandyMachineInput, 'candyMachine'>
  ): Task<(LazyNft | Nft)[]> {
    return this.metaplex
      .operations()
      .getTask(
        findMintedNftsByCandyMachineOperation({ candyMachine, ...options })
      );
  }

  insertItems(
    candyMachine: CandyMachine,
    input: Omit<InsertItemsToCandyMachineInput, 'candyMachine'>
  ): Task<InsertItemsToCandyMachineOutput & { candyMachine: CandyMachine }> {
    return new Task(async (scope) => {
      const operation = insertItemsToCandyMachineOperation({
        candyMachine,
        ...input,
      });
      const output = await this.metaplex.operations().execute(operation, scope);
      scope.throwIfCanceled();
      const updatedCandyMachine = await this.findByAddress(
        candyMachine.address
      ).run();
      return { candyMachine: updatedCandyMachine, ...output };
    });
  }

  mint(
    candyMachine: CandyMachine,
    input: Omit<MintCandyMachineInput, 'candyMachine'> = {}
  ): Task<MintCandyMachineOutput & { nft: Nft; candyMachine: CandyMachine }> {
    return new Task(async (scope) => {
      const operation = mintCandyMachineOperation({ candyMachine, ...input });
      const output = await this.metaplex.operations().execute(operation, scope);
      scope.throwIfCanceled();

      let nft: Nft;
      try {
        nft = await this.metaplex
          .nfts()
          .findByMint(output.mintSigner.publicKey)
          .run(scope);
      } catch (error) {
        throw new CandyMachineBotTaxError(
          this.metaplex.rpc().getSolanaExporerUrl(output.response.signature),
          error as Error
        );
      }
      scope.throwIfCanceled();

      const updatedCandyMachine = await this.findByAddress(
        candyMachine.address
      ).run(scope);
      return { nft, candyMachine: updatedCandyMachine, ...output };
    });
  }

  update(
    candyMachine: CandyMachine,
    input: Omit<UpdateCandyMachineInput, 'candyMachine'>
  ): Task<UpdateCandyMachineOutput & { candyMachine: CandyMachine }> {
    return new Task(async (scope) => {
      const output = await this.metaplex
        .operations()
        .execute(
          updateCandyMachineOperation({ candyMachine, ...input }),
          scope
        );
      scope.throwIfCanceled();
      const updatedCandyMachine = await this.findByAddress(
        candyMachine.address
      ).run();
      return { candyMachine: updatedCandyMachine, ...output };
    });
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
