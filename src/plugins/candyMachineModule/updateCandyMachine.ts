import type { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { Metaplex } from '@/Metaplex';
import { TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import {
  CandyMachine,
  CandyMachineUpdatableFields,
  toCandyMachineInstructionData,
} from './CandyMachine';
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

export type UpdateCandyMachineInput = Partial<
  Pick<CandyMachine, CandyMachineUpdatableFields>
> & {
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
  const {
    candyMachine,
    authority,
    newAuthority,
    updateInstructionKey,
    updateAuthorityInstructionKey,
    ...updatableFields
  } = params;
  // TODO(loris): Deep compare datas to see if we need to send the first ix.
  // const dataWithoutUpdates = toCandyMachineInstructionData(candyMachine);
  const data = toCandyMachineInstructionData({
    ...candyMachine,
    ...updatableFields,
  });

  if (newAuthority && newAuthority.equals(authority.publicKey)) {
    throw new CandyMachineAlreadyHasThisAuthorityError(newAuthority);
  }

  return (
    TransactionBuilder.make()

      // Update data.
      .add({
        instruction: createUpdateCandyMachineInstruction(
          {
            candyMachine: candyMachine.address,
            authority: authority.publicKey,
            wallet: candyMachine.walletAddress,
          },
          { data }
        ),
        signers: [authority],
        key: updateInstructionKey ?? 'update',
      })

      // Update authority.
      .when(!!newAuthority, (builder) =>
        builder.add({
          instruction: createUpdateAuthorityInstruction(
            {
              candyMachine: candyMachine.address,
              authority: authority.publicKey,
              wallet: candyMachine.walletAddress,
            },
            { newAuthority: newAuthority as PublicKey }
          ),
          signers: [authority],
          key: updateAuthorityInstructionKey ?? 'updateAuthority',
        })
      )
  );
};
