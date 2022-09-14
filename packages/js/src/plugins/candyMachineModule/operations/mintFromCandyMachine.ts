import { Metaplex } from '@/Metaplex';
import {
  Operation,
  OperationHandler,
  Program,
  Signer,
  useOperation,
} from '@/types';
import { DisposableScope, TransactionBuilder } from '@/utils';
import { ConfirmOptions } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';

// -----------------
// Operation
// -----------------

const Key = 'MintFromCandyMachineOperation' as const;

/**
 * TODO
 *
 * ```ts
 * const { nft } = await metaplex
 *   .candyMachines()
 *   .mint({
 *     // TODO
 *   })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const mintFromCandyMachineOperation =
  useOperation<MintFromCandyMachineOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type MintFromCandyMachineOperation = Operation<
  typeof Key,
  MintFromCandyMachineInput,
  MintFromCandyMachineOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type MintFromCandyMachineInput = {
  /**
   * The Signer that should pay for the mint and, therefore, own the NFT.
   * This includes paying for both storage fees and the transaction fee.
   *
   * @defaultValue `metaplex.identity()`
   */
  payer?: Signer;

  /** An optional set of programs that override the registered ones. */
  programs?: Program[];

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type MintFromCandyMachineOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const mintFromCandyMachineOperationHandler: OperationHandler<MintFromCandyMachineOperation> =
  {
    async handle(
      operation: MintFromCandyMachineOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<MintFromCandyMachineOutput> {
      const builder = mintFromCandyMachineBuilder(metaplex, operation.input);
      scope.throwIfCanceled();

      const output = await builder.sendAndConfirm(
        metaplex,
        operation.input.confirmOptions
      );
      scope.throwIfCanceled();

      return output;
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type MintFromCandyMachineBuilderParams = Omit<
  MintFromCandyMachineInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that mints from the Candy Machine. */
  mintFromCandyMachineInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type MintFromCandyMachineBuilderContext = Omit<
  MintFromCandyMachineOutput,
  'response'
>;

/**
 * TODO
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .candyMachines()
 *   .builders()
 *   .mint({
 *     // TODO
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const mintFromCandyMachineBuilder = (
  metaplex: Metaplex,
  params: MintFromCandyMachineBuilderParams
): TransactionBuilder<MintFromCandyMachineBuilderContext> => {
  const { payer = metaplex.identity() } = params;

  return TransactionBuilder.make<MintFromCandyMachineBuilderContext>()
    .setFeePayer(payer)
    .setContext({});
};
