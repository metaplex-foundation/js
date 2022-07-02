import type { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { Metaplex } from '@/Metaplex';
import { TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import {
  CandyMachineConfigs,
  getCandyMachineAccountDataFromConfigs,
} from './CandyMachineConfigs';
import { CandyMachine } from './CandyMachine';
import {
  createUpdateAuthorityInstruction,
  createUpdateCandyMachineInstruction,
} from '@metaplex-foundation/mpl-candy-machine';
import { CandyMachineAlreadyHasThisAuthorityError } from './errors';

// -----------------
// Operation
// -----------------

const Key = 'UpdateCandyMachineOperation' as const;
export const updateCandyMachineOperation =
  useOperation<UpdateCandyMachineOperation>(Key);
export type UpdateCandyMachineOperation = Operation<
  typeof Key,
  UpdateCandyMachineInput,
  UpdateCandyMachineOutput
>;

export type UpdateCandyMachineInput = Partial<CandyMachineConfigs> & {
  // Models and accounts.
  candyMachine: CandyMachine;
  authority: Signer;
  newAuthority?: PublicKey;

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};

export type UpdateCandyMachineOutput = {
  response: SendAndConfirmTransactionResponse;
};

// -----------------
// Handler
// -----------------

export const updateCandyMachineOperationHandler: OperationHandler<UpdateCandyMachineOperation> =
  {
    async handle(
      operation: UpdateCandyMachineOperation,
      metaplex: Metaplex
    ): Promise<UpdateCandyMachineOutput> {
      const builder = updateCandyMachineBuilder(metaplex, operation.input);

      const response = await metaplex
        .rpc()
        .sendAndConfirmTransaction(
          builder,
          undefined,
          operation.input.confirmOptions
        );

      return {
        response,
        ...builder.getContext(),
      };
    },
  };

// -----------------
// Builder
// -----------------

export type UpdateCandyMachineBuilderParams = Omit<
  UpdateCandyMachineInput,
  'confirmOptions'
> & {
  updateInstructionKey?: string;
  updateAuthorityInstructionKey?: string;
};

export const updateCandyMachineBuilder = (
  metaplex: Metaplex,
  params: UpdateCandyMachineBuilderParams
): TransactionBuilder => {
  const data = getCandyMachineAccountDataFromConfigs(
    { ...params.candyMachine, ...params },
    params.candyMachine.address,
    metaplex.identity().publicKey
  );

  if (
    params.newAuthority &&
    params.newAuthority.equals(params.authority.publicKey)
  ) {
    throw new CandyMachineAlreadyHasThisAuthorityError(params.newAuthority);
  }

  return (
    TransactionBuilder.make()

      // Update data.
      .add({
        instruction: createUpdateCandyMachineInstruction(
          {
            candyMachine: params.candyMachine.address,
            authority: params.authority.publicKey,
            wallet: params.candyMachine.walletAddress,
          },
          { data }
        ),
        signers: [params.authority],
        key: params.updateInstructionKey ?? 'update',
      })

      // Update authority.
      .when(!!params.newAuthority, (builder) =>
        builder.add({
          instruction: createUpdateAuthorityInstruction(
            {
              candyMachine: params.candyMachine.address,
              authority: params.authority.publicKey,
              wallet: params.candyMachine.walletAddress,
            },
            { newAuthority: params.newAuthority as PublicKey }
          ),
          signers: [params.authority],
          key: params.updateAuthorityInstructionKey ?? 'updateAuthority',
        })
      )
  );
};
