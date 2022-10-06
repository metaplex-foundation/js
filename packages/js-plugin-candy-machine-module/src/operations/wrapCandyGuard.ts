import { createWrapInstruction } from '@metaplex-foundation/mpl-candy-guard';
import { ConfirmOptions } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Metaplex } from '@metaplex-foundation/js-core/Metaplex';
import {
  Operation,
  OperationHandler,
  Program,
  PublicKey,
  Signer,
  useOperation,
} from '@metaplex-foundation/js-core/types';
import { TransactionBuilder } from '@metaplex-foundation/js-core/utils';

// -----------------
// Operation
// -----------------

const Key = 'WrapCandyGuardOperation' as const;

/**
 * Wraps the given Candy Machine in a Candy Guard.
 *
 * This makes the Candy Guard the mint authority for the Candy Machine
 * which means all minting will have to go through the Candy Guard.
 *
 * ```ts
 * await metaplex
 *   .candyMachines()
 *   .wrapCandyGuard({
 *     candyMachine,
 *     candyGuard,
 *   })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const wrapCandyGuardOperation =
  useOperation<WrapCandyGuardOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type WrapCandyGuardOperation = Operation<
  typeof Key,
  WrapCandyGuardInput,
  WrapCandyGuardOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type WrapCandyGuardInput = {
  /** The address of the Candy Machine to wrap. */
  candyMachine: PublicKey;

  /** The address of the Candy Guard to wrap the Candy Machine with. */
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
export type WrapCandyGuardOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const wrapCandyGuardOperationHandler: OperationHandler<WrapCandyGuardOperation> =
  {
    async handle(
      operation: WrapCandyGuardOperation,
      metaplex: Metaplex
    ): Promise<WrapCandyGuardOutput> {
      return wrapCandyGuardBuilder(metaplex, operation.input).sendAndConfirm(
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
export type WrapCandyGuardBuilderParams = Omit<
  WrapCandyGuardInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that wraps the Candy Machine in a Candy Guard. */
  wrapCandyGuardInstructionKey?: string;
};

/**
 * Wraps the given Candy Machine in a Candy Guard.
 *
 * This makes the Candy Guard the mint authority for the Candy Machine
 * which means all minting will have to go through the Candy Guard.
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .candyMachines()
 *   .builders()
 *   .wrapCandyGuard({
 *     candyMachine,
 *     candyGuard,
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const wrapCandyGuardBuilder = (
  metaplex: Metaplex,
  params: WrapCandyGuardBuilderParams
): TransactionBuilder => {
  const {
    candyGuard,
    candyGuardAuthority = metaplex.identity(),
    candyMachine,
    candyMachineAuthority = metaplex.identity(),
    payer = metaplex.identity(),
    programs,
  } = params;

  const candyMachineProgram = metaplex.programs().getCandyMachine(programs);
  const candyGuardProgram = metaplex.programs().getCandyGuard(programs);

  return TransactionBuilder.make()
    .setFeePayer(payer)
    .add({
      instruction: createWrapInstruction(
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
      key: params.wrapCandyGuardInstructionKey ?? 'wrapCandyGuard',
    });
};
