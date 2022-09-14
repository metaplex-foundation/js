import { Metaplex } from '@/Metaplex';
import {
  Operation,
  OperationHandler,
  Program,
  PublicKey,
  Signer,
  useOperation,
} from '@/types';
import { TransactionBuilder } from '@/utils';
import { createUnwrapInstruction } from '@metaplex-foundation/mpl-candy-guard';
import { ConfirmOptions } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';

// -----------------
// Operation
// -----------------

const Key = 'UnwrapCandyGuardOperation' as const;

/**
 * Unwraps the given Candy Machine from its Candy Guard.
 *
 * This makes the Candy Machine authority its own mint authority again
 *
 * ```ts
 * const { candyMachine } = await metaplex
 *   .candyMachines()
 *   .unwrapCandyGuard({
 *     candyMachine,
 *     candyGuard,
 *   })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const unwrapCandyGuardOperation =
  useOperation<UnwrapCandyGuardOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type UnwrapCandyGuardOperation = Operation<
  typeof Key,
  UnwrapCandyGuardInput,
  UnwrapCandyGuardOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type UnwrapCandyGuardInput = {
  /** The address of the Candy Machine to unwrap. */
  candyMachine: PublicKey;

  /** The address of the Candy Guard to unwrap the Candy Machine from. */
  candyGuard: PublicKey;

  /**
   * The authority of the Candy Machine as a Signer.
   *
   * @defaultValue `metaplex.identity()`
   */
  candyMachineAuthority?: Signer;

  /**
   * The authority of the Candy Guard as a Signer.
   *
   * @defaultValue `metaplex.identity()`
   */
  candyGuardAuthority?: Signer;

  /**
   * The Signer that should pay for the transaction fee.
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
export type UnwrapCandyGuardOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const unwrapCandyGuardOperationHandler: OperationHandler<UnwrapCandyGuardOperation> =
  {
    async handle(
      operation: UnwrapCandyGuardOperation,
      metaplex: Metaplex
    ): Promise<UnwrapCandyGuardOutput> {
      return unwrapCandyGuardBuilder(metaplex, operation.input).sendAndConfirm(
        metaplex,
        operation.input.confirmOptions
      );
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type UnwrapCandyGuardBuilderParams = Omit<
  UnwrapCandyGuardInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that unwraps the Candy Machine from its Candy Guard. */
  unwrapCandyGuardInstructionKey?: string;
};

/**
 * Unwraps the given Candy Machine from its Candy Guard.
 *
 * This makes the Candy Machine authority its own mint authority again
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .candyMachines()
 *   .builders()
 *   .unwrapCandyGuard({
 *     candyMachine,
 *     candyGuard,
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const unwrapCandyGuardBuilder = (
  metaplex: Metaplex,
  params: UnwrapCandyGuardBuilderParams
): TransactionBuilder => {
  const {
    candyGuard,
    candyGuardAuthority = metaplex.identity(),
    candyMachine,
    candyMachineAuthority = metaplex.identity(),
    payer = metaplex.identity(),
    programs,
  } = params;

  const candyMachineProgram = metaplex
    .programs()
    .get('CandyMachineProgram', programs);
  const candyGuardProgram = metaplex
    .programs()
    .get('CandyGuardProgram', programs);

  return TransactionBuilder.make()
    .setFeePayer(payer)
    .add({
      instruction: createUnwrapInstruction(
        {
          candyGuard,
          authority: candyGuardAuthority.publicKey,
          candyMachine,
          candyMachineProgram: candyMachineProgram.address,
          candyMachineAuthority: candyMachineAuthority.publicKey,
        },
        candyGuardProgram.address
      ),
      signers: [candyGuardAuthority, candyMachineAuthority],
      key: params.unwrapCandyGuardInstructionKey ?? 'unwrapCandyGuard',
    });
};
